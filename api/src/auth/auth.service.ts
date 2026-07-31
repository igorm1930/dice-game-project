import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  ARGON2_OPTIONS,
  INVALID_CREDENTIALS_RESPONSE,
  UNAUTHORIZED_RESPONSE,
} from './auth.constants';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const DUMMY_PASSWORD = 'authentication-timing-placeholder';

@Injectable()
export class AuthService {
  private readonly dummyPasswordHash = hash(DUMMY_PASSWORD, ARGON2_OPTIONS);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    const normalizedUsername = registerDto.username.toLowerCase();
    const passwordHash = await hash(registerDto.password, ARGON2_OPTIONS);

    return this.usersService.createAuthenticatedUser({
      username: registerDto.username,
      normalizedUsername,
      passwordHash,
    });
  }

  async login(loginDto: LoginDto): Promise<AuthTokenResponseDto> {
    const normalizedUsername = loginDto.username.toLowerCase();
    const user =
      await this.usersService.findForAuthentication(normalizedUsername);
    const passwordHash = user?.passwordHash ?? (await this.dummyPasswordHash);
    const passwordMatches = await verify(passwordHash, loginDto.password).catch(
      () => false,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_RESPONSE);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user._id.toString(),
      username: user.username,
      tokenUse: 'access',
    });

    return new AuthTokenResponseDto(accessToken);
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findAuthenticatedById(userId);

    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_RESPONSE);
    }

    return user;
  }
}
