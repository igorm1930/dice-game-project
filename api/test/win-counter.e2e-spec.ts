import { type INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DiceRoller } from '../src/game/domain/dice-roller';
import {
  PersistedGame,
  type PersistedGameDocument,
} from '../src/game/schemas/game.schema';
import { User, type UserDocument } from '../src/users/schemas/user.schema';
import { createTestApplication } from './test-application';

interface TestUser {
  readonly id: string;
  readonly accessToken: string;
}

interface GameResponse {
  readonly id: string;
  readonly version: number;
  readonly status: 'active' | 'won';
  readonly winnerId: string | null;
}

interface UserResponse {
  readonly id: string;
  readonly wins: number;
}

interface RegistrationResponse {
  readonly id: string;
}

interface LoginResponse {
  readonly accessToken: string;
}

describe('Win counter lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<UserDocument>;
  let gameModel: Model<PersistedGameDocument>;
  const diceRoller: DiceRoller = () => [1, 1];
  const password = 'win counter test password';

  async function startApplication(): Promise<void> {
    app = await createTestApplication({ diceRoller });
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    gameModel = app.get<Model<PersistedGameDocument>>(
      getModelToken(PersistedGame.name),
    );
  }

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
      accessToken: loginBody.accessToken,
    };
  }

  async function rollAndHold(
    game: GameResponse,
    player: TestUser,
  ): Promise<GameResponse> {
    const rolled = await request(app.getHttpServer())
      .post(`/api/games/${game.id}/roll`)
      .set('Authorization', `Bearer ${player.accessToken}`)
      .set('If-Match', JSON.stringify(String(game.version)))
      .send({})
      .expect(200);
    const rolledGame = rolled.body as GameResponse;

    const held = await request(app.getHttpServer())
      .post(`/api/games/${game.id}/hold`)
      .set('Authorization', `Bearer ${player.accessToken}`)
      .set('If-Match', JSON.stringify(String(rolledGame.version)))
      .send({})
      .expect(200);

    return held.body as GameResponse;
  }

  async function expectWins(
    player: TestUser,
    expectedWins: number,
  ): Promise<void> {
    const users = await request(app.getHttpServer())
      .get('/api/users')
      .expect(200);
    const listedPlayer = (users.body as UserResponse[]).find(
      (user) => user.id === player.id,
    );

    expect(listedPlayer?.wins).toBe(expectedWins);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${player.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: player.id,
          wins: expectedWins,
        });
      });
  }

  beforeAll(async () => {
    await startApplication();
    await userModel.init();
    await gameModel.init();
    await gameModel.deleteMany({}).exec();
    await userModel.deleteMany({}).exec();
  });

  it('counts every restarted-game victory once and persists the total', async () => {
    const playerA = await registerAndLogin(
      'WinCounterPlayerA',
      '198.51.100.210',
    );
    const playerB = await registerAndLogin(
      'WinCounterPlayerB',
      '198.51.100.211',
    );
    const created = await request(app.getHttpServer())
      .post('/api/games')
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .send({ opponentId: playerB.id, winningScore: 2 })
      .expect(201);
    const originalGame = created.body as GameResponse;

    const firstWin = await rollAndHold(originalGame, playerA);
    expect(firstWin).toMatchObject({
      id: originalGame.id,
      status: 'won',
      winnerId: playerA.id,
    });
    await expectWins(playerA, 1);

    const restart = await request(app.getHttpServer())
      .post(`/api/games/${firstWin.id}/restart`)
      .set('Authorization', `Bearer ${playerA.accessToken}`)
      .set('If-Match', JSON.stringify(String(firstWin.version)))
      .send({})
      .expect(200);
    const restarted = restart.body as GameResponse;
    expect(restarted.id).toBe(originalGame.id);

    const secondWin = await rollAndHold(restarted, playerA);
    expect(secondWin).toMatchObject({
      id: originalGame.id,
      status: 'won',
      winnerId: playerA.id,
    });
    await expectWins(playerA, 2);

    await Promise.all([
      request(app.getHttpServer())
        .get(`/api/games/${secondWin.id}`)
        .set('Authorization', `Bearer ${playerA.accessToken}`)
        .expect(200),
      request(app.getHttpServer())
        .get(`/api/games/${secondWin.id}`)
        .set('Authorization', `Bearer ${playerB.accessToken}`)
        .expect(200),
    ]);
    await expectWins(playerA, 2);

    await app.close();
    await startApplication();
    await expectWins(playerA, 2);
  });

  afterAll(async () => {
    await gameModel.deleteMany({}).exec();
    await userModel.deleteMany({}).exec();
    await app.close();
  });
});
