import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { EnvironmentVariables } from '../../config/environment';
import { UNAUTHORIZED_RESPONSE } from '../auth.constants';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from '../interfaces/access-token-payload';

interface AuthenticatedRequest extends Request {
  authenticatedUser?: AuthenticatedUser;
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.sub === 'string' &&
    payload.sub.length > 0 &&
    typeof payload.username === 'string' &&
    payload.username.length > 0 &&
    payload.tokenUse === 'access' &&
    typeof payload.iat === 'number' &&
    Number.isFinite(payload.iat) &&
    typeof payload.exp === 'number' &&
    Number.isFinite(payload.exp) &&
    payload.iss === 'dice-game-api' &&
    payload.aud === 'dice-game-web'
  );
}

function unauthorized(): UnauthorizedException {
  return new UnauthorizedException(UNAUTHORIZED_RESPONSE);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === 'string'
        ? /^Bearer ([^\s]+)$/i.exec(authorization)
        : null;

    if (!match) {
      throw unauthorized();
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(match[1], {
        secret: this.configService.get('JWT_SECRET', { infer: true }),
        algorithms: ['HS256'],
        issuer: this.configService.get('JWT_ISSUER', { infer: true }),
        audience: this.configService.get('JWT_AUDIENCE', { infer: true }),
      });

      if (!isAccessTokenPayload(payload)) {
        throw unauthorized();
      }

      request.authenticatedUser = {
        id: payload.sub,
        username: payload.username,
      };

      return true;
    } catch {
      throw unauthorized();
    }
  }
}
