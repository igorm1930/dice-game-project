import { IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  opponentId!: string;

  @ApiPropertyOptional({ example: 100, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  winningScore?: number;
}
