import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  readonly status = 'ok' as const;

  @ApiProperty({ enum: ['dice-game-api'], example: 'dice-game-api' })
  readonly service = 'dice-game-api' as const;
}
