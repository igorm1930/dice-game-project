import { IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class CreateGameDto {
  @IsMongoId()
  opponentId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  winningScore?: number;
}
