import { ACCESS_TOKEN_TTL_SECONDS } from '../auth.constants';

export class AuthTokenResponseDto {
  readonly accessToken: string;
  readonly tokenType = 'Bearer';
  readonly expiresIn = ACCESS_TOKEN_TTL_SECONDS;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
