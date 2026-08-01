import { type INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { Types, type Model } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DiceRoll, DiceRoller } from '../src/game/domain/dice-roller';
import {
  PersistedGame,
  type PersistedGameDocument,
} from '../src/game/schemas/game.schema';
import { User, type UserDocument } from '../src/users/schemas/user.schema';
import { createTestApplication } from './test-application';

interface TestUser {
  readonly id: string;
  readonly username: string;
  readonly accessToken: string;
}

interface RegistrationResponse {
  readonly id: string;
}

interface LoginResponse {
  readonly accessToken: string;
}

interface GameResponse {
  readonly id: string;
  readonly version: number;
  readonly players: readonly [
    { readonly id: string; readonly globalScore: number },
    { readonly id: string; readonly globalScore: number },
  ];
  readonly activePlayerId: string;
  readonly roundScore: number;
  readonly winningScore: number;
  readonly lastRoll: readonly [number, number] | null;
  readonly status: 'active' | 'won';
  readonly winnerId: string | null;
  readonly allowedActions: readonly string[];
}

describe('Game API (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<UserDocument>;
  let gameModel: Model<PersistedGameDocument>;
  let playerA: TestUser;
  let playerB: TestUser;
  let outsider: TestUser;
  let game: GameResponse;

  const password = 'phase eleven test password';
  const diceRolls: DiceRoll[] = [
    [2, 3],
    [6, 6],
    [4, 6],
    [1, 2],
    [3, 4],
  ];
  const diceRoller: DiceRoller = () => {
    const roll = diceRolls.shift();

    if (!roll) {
      throw new Error('The deterministic E2E dice sequence is exhausted.');
    }

    return roll;
  };

  async function registerAndLogin(
    username: string,
    clientAddress: string,
  ): Promise<TestUser> {
    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-For', clientAddress)
      .send({ username, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-For', clientAddress)
      .send({ username, password })
      .expect(200);

    const registrationBody = registration.body as RegistrationResponse;
    const loginBody = login.body as LoginResponse;

    return {
      id: registrationBody.id,
      username,
      accessToken: loginBody.accessToken,
    };
  }

  async function restartApplication(): Promise<void> {
    await app.close();
    app = await createTestApplication({ diceRoller });
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    gameModel = app.get<Model<PersistedGameDocument>>(
      getModelToken(PersistedGame.name),
    );
  }

  beforeAll(async () => {
    app = await createTestApplication({ diceRoller });
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    gameModel = app.get<Model<PersistedGameDocument>>(
      getModelToken(PersistedGame.name),
    );
    await userModel.init();
    await gameModel.init();
    await gameModel.deleteMany({}).exec();
    await userModel.deleteMany({}).exec();
    playerA = await registerAndLogin('GamePlayerA', '198.51.100.101');
    playerB = await registerAndLogin('GamePlayerB', '198.51.100.102');
    outsider = await registerAndLogin('GameOutsider', '198.51.100.103');
  });

  it('protects game creation with JWT authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/games')
      .send({ opponentId: playerB.id })
      .expect(401)
      .expect({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
  });

  it('rejects invalid, extra, self, and unknown opponent input', async () => {
    await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: 'not-an-id' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerB.id, actorId: playerB.id })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerA.id })
      .expect(400)
      .expect({
        statusCode: 400,
        code: 'INVALID_PLAYERS',
        message: 'A game requires two different authenticated players.',
      });

    await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: new Types.ObjectId().toString() })
      .expect(404)
      .expect({
        statusCode: 404,
        code: 'OPPONENT_NOT_FOUND',
        message: 'Opponent not found.',
      });
  });

  it('creates a game from JWT identity with a custom winning score', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerB.id, winningScore: 10 })
      .expect(201);

    game = response.body as GameResponse;
    expect(game).toEqual({
      id: expect.any(String) as string,
      version: 0,
      players: [
        { id: playerA.id, globalScore: 0 },
        { id: playerB.id, globalScore: 0 },
      ],
      activePlayerId: playerA.id,
      roundScore: 0,
      winningScore: 10,
      lastRoll: null,
      status: 'active',
      winnerId: null,
      allowedActions: ['roll', 'hold', 'restart'],
    });
  });

  it('returns caller-specific permissions to both participants', async () => {
    await request(app.getHttpServer())
      .get(`/api/games/${game.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as GameResponse;
        expect(body.allowedActions).toEqual(['roll', 'hold', 'restart']);
      });

    await request(app.getHttpServer())
      .get(`/api/games/${game.id}`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as GameResponse;
        expect(body.allowedActions).toEqual(['restart']);
      });
  });

  it('uses the same 404 for a non-participant and a missing game', async () => {
    const [hidden, missing] = await Promise.all([
      request(app.getHttpServer())
        .get(`/api/games/${game.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`),
      request(app.getHttpServer())
        .get(`/api/games/${randomUUID()}`)
        .set('Authorization', `Bearer ${playerA.accessToken}`),
    ]);

    expect(hidden.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(hidden.body).toEqual({
      statusCode: 404,
      code: 'GAME_NOT_FOUND',
      message: 'Game not found.',
    });
    expect(missing.body).toEqual(hidden.body);
  });

  it('rejects client-supplied identity and authoritative game fields', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({
        actorId: playerB.id,
        dice: [1, 1],
        roundScore: 99,
        winnerId: playerB.id,
      })
      .expect(400);
  });

  it('rejects an authenticated participant outside their turn', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(409)
      .expect({
        statusCode: 409,
        code: 'NOT_YOUR_TURN',
        message: 'It is not your turn.',
      });
  });

  it('rolls and holds through the authenticated active player', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(200)
      .expect((response) => {
        game = response.body as GameResponse;
        expect(response.body).toMatchObject({
          version: 1,
          activePlayerId: playerA.id,
          roundScore: 5,
          lastRoll: [2, 3],
        });
      });

    await restartApplication();
    await request(app.getHttpServer())
      .get(`/api/games/${game.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          activePlayerId: playerA.id,
          roundScore: 5,
          lastRoll: [2, 3],
        });
      });

    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/hold`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(200)
      .expect((response) => {
        game = response.body as GameResponse;
        expect(response.body).toMatchObject({
          version: 2,
          players: [
            { id: playerA.id, globalScore: 5 },
            { id: playerB.id, globalScore: 0 },
          ],
          activePlayerId: playerB.id,
          roundScore: 0,
        });
      });

    await restartApplication();
    await request(app.getHttpServer())
      .get(`/api/games/${game.id}`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          players: [
            { id: playerA.id, globalScore: 5 },
            { id: playerB.id, globalScore: 0 },
          ],
          activePlayerId: playerB.id,
          roundScore: 0,
          allowedActions: ['roll', 'hold', 'restart'],
        });
      });
  });

  it('applies double-six bust and passes the turn', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(200)
      .expect((response) => {
        game = response.body as GameResponse;
        expect(response.body).toMatchObject({
          version: 3,
          activePlayerId: playerA.id,
          roundScore: 0,
          lastRoll: [6, 6],
        });
      });

    await restartApplication();
    await request(app.getHttpServer())
      .get(`/api/games/${game.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          activePlayerId: playerA.id,
          roundScore: 0,
          lastRoll: [6, 6],
        });
      });
  });

  it('wins only after Hold and rejects later Roll or Hold', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(200)
      .expect((response) => {
        game = response.body as GameResponse;
        expect(game.version).toBe(4);
        expect(game.status).toBe('active');
        expect(game.roundScore).toBe(10);
      });

    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/hold`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(200)
      .expect((response) => {
        game = response.body as GameResponse;
        expect(response.body).toMatchObject({
          version: 5,
          status: 'won',
          winnerId: playerA.id,
          allowedActions: ['restart'],
        });
      });

    await restartApplication();
    await request(app.getHttpServer())
      .get(`/api/games/${game.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'won',
          winnerId: playerA.id,
          allowedActions: ['restart'],
        });
      });

    for (const action of ['roll', 'hold']) {
      await request(app.getHttpServer())
        .post(`/api/games/${game.id}/${action}`)
        .set('Authorization', `Bearer ${playerA.accessToken}`)
        .set('If-Match', JSON.stringify(String(game.version)))
        .send({})
        .expect(409)
        .expect({
          statusCode: 409,
          code: 'GAME_FINISHED',
          message:
            'The game is finished. Restart before taking another action.',
        });
    }

    await Promise.all([
      request(app.getHttpServer())
        .get(`/api/games/${game.id}`)
        .set('Authorization', `Bearer ${playerA.accessToken}`)
        .expect(200),
      request(app.getHttpServer())
        .get(`/api/games/${game.id}`)
        .set('Authorization', `Bearer ${playerB.accessToken}`)
        .expect(200),
    ]);
    const winner = await userModel
      .findById(playerA.id)
      .select('+countedWinGameIds')
      .exec();

    expect(winner?.wins).toBe(1);
    expect(winner?.countedWinGameIds).toEqual([game.id]);
  });

  it('allows either participant to restart while preserving configuration', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/restart`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(200)
      .expect((response) => {
        game = response.body as GameResponse;
        expect(response.body).toMatchObject({
          version: 6,
          players: [
            { id: playerA.id, globalScore: 0 },
            { id: playerB.id, globalScore: 0 },
          ],
          activePlayerId: playerA.id,
          roundScore: 0,
          winningScore: 10,
          lastRoll: null,
          status: 'active',
          winnerId: null,
          allowedActions: ['restart'],
        });
      });

    await restartApplication();
    await request(app.getHttpServer())
      .get(`/api/games/${game.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          players: [
            { id: playerA.id, globalScore: 0 },
            { id: playerB.id, globalScore: 0 },
          ],
          activePlayerId: playerA.id,
          roundScore: 0,
          winningScore: 10,
          lastRoll: null,
          status: 'active',
          winnerId: null,
          allowedActions: ['roll', 'hold', 'restart'],
        });
      });
  });

  it('validates game identifiers before lookup', async () => {
    await request(app.getHttpServer())
      .get('/api/games/not-a-uuid')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(400);
  });

  it('requires a strong current version for game mutations', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({})
      .expect(400)
      .expect({
        statusCode: 400,
        code: 'INVALID_GAME_VERSION',
        message: 'If-Match must contain the current quoted game version.',
      });

    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', String(game.version))
      .send({})
      .expect(400);
  });

  it('allows only one mutation for duplicate requests from one version', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerB.id, winningScore: 50 })
      .expect(201);
    const duplicateGame = created.body as GameResponse;
    const performRoll = () =>
      request(app.getHttpServer())
        .post(`/api/games/${duplicateGame.id}/roll`)
        .set('Authorization', `Bearer ${playerA.accessToken}`)
        .set('If-Match', JSON.stringify(String(duplicateGame.version)))
        .send({});

    const responses = await Promise.all([performRoll(), performRoll()]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    expect(responses.find((response) => response.status === 409)?.body).toEqual(
      {
        statusCode: 409,
        code: 'GAME_STATE_CONFLICT',
        message: 'The game changed. Load the latest state before trying again.',
      },
    );

    await request(app.getHttpServer())
      .get(`/api/games/${duplicateGame.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as GameResponse;
        expect(body.version).toBe(1);
        expect([3, 7]).toContain(body.roundScore);
      });

    await gameModel.deleteOne({ _id: duplicateGame.id }).exec();
  });

  afterAll(async () => {
    if (gameModel) {
      await gameModel.deleteMany({}).exec();
    }
    if (userModel) {
      await userModel.deleteMany({}).exec();
    }
    if (app) {
      await app.close();
    }
  });
});
