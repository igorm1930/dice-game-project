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
  readonly lastEvent: 'ROLL' | 'BUST' | 'HOLD' | 'RESTART' | null;
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
    [2, 3],
    [6, 6],
    [2, 3],
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
      lastEvent: null,
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

    for (const action of ['roll', 'hold', 'restart']) {
      await request(app.getHttpServer())
        .post(`/api/games/${game.id}/${action}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .set('If-Match', JSON.stringify(String(game.version)))
        .send({})
        .expect(404)
        .expect(hidden.body);
    }
  });

  it('rejects client-supplied identity and authoritative game fields', async () => {
    await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({
        actorId: playerB.id,
        dice: [1, 1],
        players: [{ id: playerB.id, globalScore: 99 }],
        globalScore: 99,
        roundScore: 99,
        winningScore: 999,
        activePlayerId: playerB.id,
        status: 'won',
        winnerId: playerB.id,
        ruleSetId: 'client-selected-v1',
        lastEvent: 'BUST',
        allowedActions: ['roll', 'hold', 'restart'],
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
          lastEvent: 'ROLL',
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
          lastEvent: 'ROLL',
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
          lastEvent: 'HOLD',
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
          lastEvent: 'HOLD',
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
          lastEvent: 'BUST',
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
          lastEvent: 'BUST',
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
          lastEvent: 'HOLD',
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
          lastEvent: 'RESTART',
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
          lastEvent: 'RESTART',
          status: 'active',
          winnerId: null,
          allowedActions: ['roll', 'hold', 'restart'],
        });
      });

    await expect(
      gameModel.findById(game.id).lean().exec(),
    ).resolves.toMatchObject({
      ruleSetId: 'double-six-v1',
      lastEvent: 'RESTART',
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

  it('continues the same persisted game with the next player after double six', async () => {
    const gameCountBeforeCreate = await gameModel.countDocuments().exec();
    const playerABefore = await userModel.findById(playerA.id).exec();
    const playerBBefore = await userModel.findById(playerB.id).exec();
    const created = await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerB.id, winningScore: 100 })
      .expect(201);
    const continuationGame = created.body as GameResponse;
    const continuationGameId = continuationGame.id;
    const gameCountAfterCreate = await gameModel.countDocuments().exec();

    expect(gameCountAfterCreate).toBe(gameCountBeforeCreate + 1);

    const firstRoll = await request(app.getHttpServer())
      .post(`/api/games/${continuationGameId}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(continuationGame.version)))
      .send({})
      .expect(200);
    const firstRollBody = firstRoll.body as GameResponse;
    expect(firstRoll.headers.etag).toBe(JSON.stringify('1'));
    expect(firstRoll.body).toMatchObject({
      id: continuationGameId,
      version: 1,
      activePlayerId: playerA.id,
      roundScore: 5,
      lastRoll: [2, 3],
      lastEvent: 'ROLL',
      allowedActions: ['roll', 'hold', 'restart'],
    });

    const bust = await request(app.getHttpServer())
      .post(`/api/games/${continuationGameId}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(firstRollBody.version)))
      .send({})
      .expect(200);

    expect(bust.headers.etag).toBe(JSON.stringify('2'));
    expect(bust.body).toMatchObject({
      id: continuationGameId,
      version: 2,
      players: [
        { id: playerA.id, globalScore: 0 },
        { id: playerB.id, globalScore: 0 },
      ],
      activePlayerId: playerB.id,
      roundScore: 0,
      winningScore: 100,
      lastRoll: [6, 6],
      lastEvent: 'BUST',
      status: 'active',
      winnerId: null,
      allowedActions: ['restart'],
    });

    const storedBust = await gameModel
      .findById(continuationGameId)
      .lean()
      .exec();
    expect(storedBust).toMatchObject({
      _id: continuationGameId,
      version: 2,
      players: [
        { id: playerA.id, globalScore: 0 },
        { id: playerB.id, globalScore: 0 },
      ],
      activePlayerIndex: 1,
      roundScore: 0,
      winningScore: 100,
      ruleSetId: 'double-six-v1',
      lastRoll: [6, 6],
      lastEvent: 'BUST',
      status: 'active',
      winnerId: null,
    });

    const playerAView = await request(app.getHttpServer())
      .get(`/api/games/${continuationGameId}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200);
    const playerAViewBody = playerAView.body as GameResponse;
    expect(playerAViewBody.allowedActions).toEqual(['restart']);

    const playerBView = await request(app.getHttpServer())
      .get(`/api/games/${continuationGameId}`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .expect(200);
    expect(playerBView.body).toMatchObject({
      id: continuationGameId,
      version: 2,
      activePlayerId: playerB.id,
      roundScore: 0,
      lastRoll: [6, 6],
      lastEvent: 'BUST',
      status: 'active',
      winnerId: null,
      allowedActions: ['roll', 'hold', 'restart'],
    });

    const nextRoll = await request(app.getHttpServer())
      .post(`/api/games/${continuationGameId}/roll`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .set('If-Match', JSON.stringify('2'))
      .send({})
      .expect(200);
    expect(nextRoll.headers.etag).toBe(JSON.stringify('3'));
    expect(nextRoll.body).toMatchObject({
      id: continuationGameId,
      version: 3,
      activePlayerId: playerB.id,
      roundScore: 5,
      lastRoll: [2, 3],
      lastEvent: 'ROLL',
      status: 'active',
      winnerId: null,
      allowedActions: ['roll', 'hold', 'restart'],
    });

    const nextHold = await request(app.getHttpServer())
      .post(`/api/games/${continuationGameId}/hold`)
      .set('Authorization', `Bearer ${playerB.accessToken}`)
      .set('If-Match', JSON.stringify('3'))
      .send({})
      .expect(200);
    expect(nextHold.headers.etag).toBe(JSON.stringify('4'));
    expect(nextHold.body).toMatchObject({
      id: continuationGameId,
      version: 4,
      players: [
        { id: playerA.id, globalScore: 0 },
        { id: playerB.id, globalScore: 5 },
      ],
      activePlayerId: playerA.id,
      roundScore: 0,
      lastRoll: [2, 3],
      lastEvent: 'HOLD',
      status: 'active',
      winnerId: null,
      allowedActions: ['restart'],
    });

    const [playerAAfter, playerBAfter, finalStoredGame, finalGameCount] =
      await Promise.all([
        userModel.findById(playerA.id).exec(),
        userModel.findById(playerB.id).exec(),
        gameModel.findById(continuationGameId).lean().exec(),
        gameModel.countDocuments().exec(),
      ]);

    expect(playerAAfter?.wins).toBe(playerABefore?.wins);
    expect(playerBAfter?.wins).toBe(playerBBefore?.wins);
    expect(finalGameCount).toBe(gameCountAfterCreate);
    expect(finalStoredGame).toMatchObject({
      _id: continuationGameId,
      version: 4,
      players: [
        { id: playerA.id, globalScore: 0 },
        { id: playerB.id, globalScore: 5 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      winningScore: 100,
      ruleSetId: 'double-six-v1',
      lastRoll: [2, 3],
      lastEvent: 'HOLD',
      status: 'active',
      winnerId: null,
    });
  });

  it('loads a legacy game as double-six-v1 and lazily persists compatibility fields', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerB.id, winningScore: 40 })
      .expect(201);
    const legacyGame = created.body as GameResponse;

    await gameModel.collection.updateOne(
      { _id: legacyGame.id },
      {
        $unset: { ruleSetId: '', lastEvent: '' },
        $set: { legacyMarker: 'preserved' },
      },
    );
    await restartApplication();

    const legacyView = await request(app.getHttpServer())
      .get(`/api/games/${legacyGame.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(200);
    expect(legacyView.body).toMatchObject({
      id: legacyGame.id,
      version: 0,
      lastRoll: null,
      lastEvent: null,
    });

    const rolled = await request(app.getHttpServer())
      .post(`/api/games/${legacyGame.id}/roll`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify('0'))
      .send({})
      .expect(200);
    expect(rolled.body).toMatchObject({
      id: legacyGame.id,
      version: 1,
      roundScore: 7,
      lastRoll: [3, 4],
      lastEvent: 'ROLL',
    });

    const stored = await gameModel.collection.findOne({ _id: legacyGame.id });
    expect(stored).toMatchObject({
      _id: legacyGame.id,
      version: 1,
      ruleSetId: 'double-six-v1',
      lastEvent: 'ROLL',
      legacyMarker: 'preserved',
    });
  });

  it('fails safely without mutating a game with an unknown stored rule ID', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerB.id })
      .expect(201);
    const unknownRulesGame = created.body as GameResponse;

    await gameModel.collection.updateOne(
      { _id: unknownRulesGame.id },
      {
        $set: { ruleSetId: 'unknown-v1' },
      },
    );

    await request(app.getHttpServer())
      .get(`/api/games/${unknownRulesGame.id}`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .expect(500)
      .expect({
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      });

    const stored = await gameModel.collection.findOne({
      _id: unknownRulesGame.id,
    });
    expect(stored).toMatchObject({
      version: 0,
      ruleSetId: 'unknown-v1',
      lastEvent: null,
    });
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
