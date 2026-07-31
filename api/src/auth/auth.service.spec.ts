import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { Types } from 'mongoose';
import type { UsersService } from '../users/users.service';
import { ARGON2_OPTIONS, INVALID_CREDENTIALS_RESPONSE } from './auth.constants';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const createAuthenticatedUser = jest.fn();
  const findForAuthentication = jest.fn();
  const findAuthenticatedById = jest.fn();
  const signAsync = jest.fn();
  const usersService = {
    createAuthenticatedUser,
    findForAuthentication,
    findAuthenticatedById,
  } as unknown as UsersService;
  const jwtService = { signAsync } as unknown as JwtService;
  const publicUser = {
    id: new Types.ObjectId().toString(),
    username: 'AuthPlayer',
    wins: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(usersService, jwtService);
  });

  it('normalizes the username and stores an Argon2id password hash', async () => {
    let capturedInput:
      | {
          username: string;
          normalizedUsername: string;
          passwordHash: string;
        }
      | undefined;
    createAuthenticatedUser.mockImplementation((input: unknown) => {
      capturedInput = input as typeof capturedInput;
      return Promise.resolve(publicUser);
    });

    await service.register({
      username: 'AuthPlayer',
      password: 'correct horse battery staple',
    });

    if (!capturedInput) {
      throw new Error('Expected registration input to be captured');
    }

    const input = capturedInput;
    expect(input.username).toBe('AuthPlayer');
    expect(input.normalizedUsername).toBe('authplayer');
    expect(input.passwordHash).toMatch(/^\$argon2id\$/);
    expect(input.passwordHash).not.toContain('correct horse battery staple');
    await expect(
      verify(input.passwordHash, 'correct horse battery staple'),
    ).resolves.toBe(true);
  });

  it('returns a bearer access token for valid credentials', async () => {
    const passwordHash = await hash('valid password', ARGON2_OPTIONS);
    findForAuthentication.mockResolvedValue({
      _id: new Types.ObjectId(publicUser.id),
      username: publicUser.username,
      passwordHash,
    });
    signAsync.mockResolvedValue('signed-access-token');

    await expect(
      service.login({ username: 'AUTHPLAYER', password: 'valid password' }),
    ).resolves.toEqual({
      accessToken: 'signed-access-token',
      tokenType: 'Bearer',
      expiresIn: 1800,
    });
    expect(findForAuthentication).toHaveBeenCalledWith('authplayer');
    expect(signAsync).toHaveBeenCalledWith({
      sub: publicUser.id,
      username: publicUser.username,
      tokenUse: 'access',
    });
  });

  it.each([
    ['unknown user', null],
    [
      'incorrect password',
      {
        _id: new Types.ObjectId(),
        username: 'AuthPlayer',
        passwordHash: '$argon2id$invalid',
      },
    ],
  ])('uses the generic login failure for %s', async (_case, user) => {
    findForAuthentication.mockResolvedValue(user);

    const result = service.login({
      username: 'AuthPlayer',
      password: 'wrong password',
    });

    await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(result).rejects.toMatchObject({
      response: INVALID_CREDENTIALS_RESPONSE,
    });
  });

  it('rejects a token subject whose user no longer exists', async () => {
    findAuthenticatedById.mockResolvedValue(null);

    await expect(service.getCurrentUser(publicUser.id)).rejects.toMatchObject({
      response: {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
  });
});
