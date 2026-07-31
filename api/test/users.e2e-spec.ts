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
  createdAt: string;
  updatedAt: string;
}

describe('Users API (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<UserDocument>;
  let createdUser: UserResponseBody;

  beforeAll(async () => {
    app = await createTestApplication();
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    await userModel.init();
    await userModel.deleteMany({}).exec();
  });

  it('creates a trimmed user and returns only public fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send({ username: '  PhaseFourUser  ' })
      .expect(201);

    createdUser = response.body as UserResponseBody;

    expect(createdUser).toEqual({
      id: expect.any(String) as string,
      username: 'PhaseFourUser',
      createdAt: expect.any(String) as string,
      updatedAt: expect.any(String) as string,
    });
    expect(response.body).not.toHaveProperty('_id');
    expect(response.body).not.toHaveProperty('__v');
  });

  it('lists users and retrieves one by id', async () => {
    await request(app.getHttpServer())
      .get('/api/users')
      .expect(200)
      .expect([createdUser]);

    await request(app.getHttpServer())
      .get(`/api/users/${createdUser.id}`)
      .expect(200)
      .expect(createdUser);
  });

  it.each([
    [{ username: '' }],
    [{ username: 'ab' }],
    [{ username: 'invalid name' }],
    [{ username: 'ValidUser', role: 'admin' }],
  ])('rejects invalid user input %#', async (body) => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send(body)
      .expect(400);
  });

  it('rejects a case-insensitive duplicate username', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({ username: 'phasefouruser' })
      .expect(409)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Username is already in use',
          statusCode: 409,
        });
      });
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
      .expect([createdUser]);
  });

  afterAll(async () => {
    await userModel.deleteMany({}).exec();
    await app.close();
  });
});
