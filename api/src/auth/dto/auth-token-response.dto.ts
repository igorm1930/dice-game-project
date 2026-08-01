import { ACCESS_TOKEN_TTL_SECONDS } from '../auth.constants';
import { ApiProperty } from '@nestjs/swagger';

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'JWT access token', writeOnly: true })
  readonly accessToken: string;

  @ApiProperty({ enum: ['Bearer'] })
  readonly tokenType = 'Bearer';

  @ApiProperty({ example: ACCESS_TOKEN_TTL_SECONDS })
  readonly expiresIn = ACCESS_TOKEN_TTL_SECONDS;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
