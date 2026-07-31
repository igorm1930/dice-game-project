import { type INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import { User, type UserDocument } from '../src/users/schemas/user.schema';
import { createTestApplication } from './test-application';

interface UserResponseBody {
  id: string;
  username: string;
  wins: number;
  createdAt: string;
  updatedAt: string;
}

describe('Users API (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<UserDocument>;
  let createdUser: UserResponseBody;
  let legacyUser: UserResponseBody;

  beforeAll(async () => {
    app = await createTestApplication();
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    await userModel.init();
    await userModel.deleteMany({}).exec();
  });

  it('lists an authenticated user with only public fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-For', '198.51.100.10')
      .send({
        username: '  PhaseEightUser  ',
        password: 'phase eight password',
      })
      .expect(201);

    createdUser = response.body as UserResponseBody;

    expect(createdUser).toEqual({
      id: expect.any(String) as string,
      username: 'PhaseEightUser',
      wins: 0,
      createdAt: expect.any(String) as string,
      updatedAt: expect.any(String) as string,
    });
    expect(response.body).not.toHaveProperty('_id');
    expect(response.body).not.toHaveProperty('__v');
    expect(response.body).not.toHaveProperty('normalizedUsername');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('lists users and retrieves one by id', async () => {
    const legacyTimestamp = new Date('2099-01-01T00:00:00.000Z');
    const legacyResult = await userModel.collection.insertOne({
      username: 'LegacyPlayer',
      createdAt: legacyTimestamp,
      updatedAt: legacyTimestamp,
    });
    legacyUser = {
      id: legacyResult.insertedId.toString(),
      username: 'LegacyPlayer',
      wins: 0,
      createdAt: legacyTimestamp.toISOString(),
      updatedAt: legacyTimestamp.toISOString(),
    };

    await request(app.getHttpServer())
      .get('/api/users')
      .expect(200)
      .expect([createdUser, legacyUser]);

    await request(app.getHttpServer())
      .get(`/api/users/${createdUser.id}`)
      .expect(200)
      .expect(createdUser);
  });

  it('does not expose the legacy unauthenticated creation endpoint', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({ username: 'UnprotectedUser' })
      .expect(404);
  });

  it('returns clear errors for malformed and unknown user ids', async () => {
    await request(app.getHttpServer()).get('/api/users/not-an-id').expect(400);
    await request(app.getHttpServer())
      .get('/api/users/000000000000000000000000')
      .expect(404)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'User not found',
          statusCode: 404,
        });
      });
  });

  it('keeps users after the Nest application restarts', async () => {
    await app.close();
    app = await createTestApplication();
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    await request(app.getHttpServer())
      .get('/api/users')
      .expect(200)
      .expect([createdUser, legacyUser]);
  });

  afterAll(async () => {
    await userModel.deleteMany({}).exec();
    await app.close();
  });
});
