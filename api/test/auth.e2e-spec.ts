import { type INestApplication } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { verify } from 'argon2';
import type { Model } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import { User, type UserDocument } from '../src/users/schemas/user.schema';
import { createTestApplication } from './test-application';

interface PublicUserResponse {
  id: string;
  username: string;
  wins: number;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

describe('Authentication API (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;
  let registeredUser: PublicUserResponse;
  let accessToken: string;

  const validPassword = ' \u2603 valid password with spaces ';
  const authPayload = () => ({
    sub: registeredUser.id,
    username: registeredUser.username,
    tokenUse: 'access',
  });
  const signAccessToken = (
    payload: Record<string, unknown> = authPayload(),
    options: JwtSignOptions = {},
  ) =>
    jwtService.sign(payload, {
      algorithm: 'HS256',
      expiresIn: '30m',
      issuer: 'dice-game-api',
      audience: 'dice-game-web',
      ...options,
    });

  beforeAll(async () => {
    app = await createTestApplication();
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    jwtService = new JwtService({ secret: process.env.JWT_SECRET });
    await userModel.init();
    await userModel.deleteMany({}).exec();
  });

  it.each([
    [{ username: 'ab', password: validPassword }, '198.51.100.20'],
    [{ username: 'invalid name', password: validPassword }, '198.51.100.21'],
    [{ username: 'ValidUser', password: 'short' }, '198.51.100.22'],
    [{ username: 'ValidUser', password: 'x'.repeat(129) }, '198.51.100.23'],
    [
      { username: 'ValidUser', password: validPassword, role: 'admin' },
      '198.51.100.24',
    ],
  ])('rejects invalid registration input %#', async (body, clientAddress) => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-For', clientAddress)
      .send(body)
      .expect(400);
  });

  it('registers a trimmed username and protects password data', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-For', '198.51.100.80')
      .send({ username: '  AuthPlayer  ', password: validPassword })
      .expect(201);

    registeredUser = response.body as PublicUserResponse;
    expect(registeredUser).toEqual({
      id: expect.any(String) as string,
      username: 'AuthPlayer',
      wins: 0,
      createdAt: expect.any(String) as string,
      updatedAt: expect.any(String) as string,
    });
    expect(JSON.stringify(response.body)).not.toContain(validPassword);
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('normalizedUsername');
    expect(response.body).not.toHaveProperty('accessToken');

    const storedUser = await userModel
      .findById(registeredUser.id)
      .select('+passwordHash +normalizedUsername')
      .exec();
    expect(storedUser?.normalizedUsername).toBe('authplayer');
    expect(storedUser?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(storedUser?.passwordHash).not.toContain(validPassword);
    await expect(
      verify(storedUser?.passwordHash ?? '', validPassword),
    ).resolves.toBe(true);
  });

  it('returns the approved conflict for a normalized duplicate', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('X-Forwarded-For', '198.51.100.81')
      .send({ username: 'authplayer', password: 'another valid password' })
      .expect(409)
      .expect({
        statusCode: 409,
        code: 'USERNAME_UNAVAILABLE',
        message: 'Username is unavailable.',
      });
  });

  it('uses the same response for unknown users and incorrect passwords', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', '198.51.100.82')
        .send({ username: 'UnknownUser', password: validPassword }),
      request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', '198.51.100.83')
        .send({ username: 'AuthPlayer', password: 'incorrect password' }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password.',
      });
      expect(JSON.stringify(response.body)).not.toContain('incorrect password');
      expect(response.body).not.toHaveProperty('accessToken');
    }
  });

  it('logs in and returns a constrained access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.84')
      .send({ username: 'AUTHPlaYer', password: validPassword })
      .expect(200);

    const body = response.body as LoginResponse;
    accessToken = body.accessToken;
    expect(body).toEqual({
      accessToken: expect.any(String) as string,
      tokenType: 'Bearer',
      expiresIn: 1800,
    });
    expect(
      jwtService.verify(accessToken, {
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
        issuer: 'dice-game-api',
        audience: 'dice-game-web',
      }),
    ).toMatchObject({
      sub: registeredUser.id,
      username: 'AuthPlayer',
      tokenUse: 'access',
      iss: 'dice-game-api',
      aud: 'dice-game-web',
      iat: expect.any(Number) as number,
      exp: expect.any(Number) as number,
    });
  });

  it('returns the current user derived from the access-token subject', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me?userId=000000000000000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(registeredUser);
  });

  it.each([
    ['missing token', undefined],
    ['malformed token', 'Bearer not-a-token'],
    ['malformed scheme', `Basic ${accessToken}`],
  ])('rejects a %s', async (_case, authorization) => {
    const call = request(app.getHttpServer()).get('/api/auth/me');
    if (authorization) {
      call.set('Authorization', authorization);
    }

    await call.expect(401).expect({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  });

  it.each([
    [
      'invalid signature',
      () =>
        new JwtService({ secret: 'x'.repeat(32) }).sign(authPayload(), {
          algorithm: 'HS256',
          expiresIn: '30m',
          issuer: 'dice-game-api',
          audience: 'dice-game-web',
        }),
    ],
    ['expired token', () => signAccessToken(authPayload(), { expiresIn: -1 })],
    [
      'wrong issuer',
      () => signAccessToken(authPayload(), { issuer: 'another-api' }),
    ],
    [
      'wrong audience',
      () => signAccessToken(authPayload(), { audience: 'another-client' }),
    ],
    [
      'unsupported algorithm',
      () => signAccessToken(authPayload(), { algorithm: 'HS384' }),
    ],
    [
      'missing subject',
      () => signAccessToken({ username: 'AuthPlayer', tokenUse: 'access' }),
    ],
    [
      'wrong token use',
      () => signAccessToken({ ...authPayload(), tokenUse: 'refresh' }),
    ],
    [
      'missing expiration',
      () =>
        jwtService.sign(authPayload(), {
          algorithm: 'HS256',
          issuer: 'dice-game-api',
          audience: 'dice-game-web',
        }),
    ],
  ])('rejects a token with %s', async (_case, tokenFactory) => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenFactory()}`)
      .expect(401)
      .expect({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
  });

  it('limits registration to three requests per minute per client IP', async () => {
    const responses = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      responses.push(
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .set('X-Forwarded-For', '203.0.113.10')
          .send({ username: 'ab', password: validPassword }),
      );
    }

    expect(responses.map(({ status }) => status)).toEqual([400, 400, 400, 429]);
  });

  it('limits login to five requests per minute per client IP', async () => {
    const responses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .set('X-Forwarded-For', '203.0.113.11')
          .send({ username: 'UnknownUser', password: validPassword }),
      );
    }

    expect(responses.map(({ status }) => status)).toEqual([
      401, 401, 401, 401, 401, 429,
    ]);
  });

  afterAll(async () => {
    await userModel.deleteMany({}).exec();
    await app.close();
  });
});
