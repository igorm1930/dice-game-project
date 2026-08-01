import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 409 })
  readonly statusCode!: number;

  @ApiProperty({ example: 'GAME_STATE_CONFLICT' })
  readonly code!: string;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'The game changed. Load the latest state.' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['opponentId must be a mongodb id'],
      },
    ],
  })
  readonly message!: string | string[];
}
