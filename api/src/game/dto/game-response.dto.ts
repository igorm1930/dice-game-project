import type { DieValue } from '../domain/dice-roller';
import type { GameEvent, GameStatus } from '../domain/game.types';
import type { GameRecord } from '../repositories/game.repository';
import { ApiProperty } from '@nestjs/swagger';

export type AllowedGameAction = 'roll' | 'hold' | 'restart';

export class GamePlayerResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  readonly id!: string;

  @ApiProperty({ example: 12, minimum: 0 })
  readonly globalScore!: number;
}

export class GameResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id: string;

  @ApiProperty({ example: 4, minimum: 0 })
  readonly version: number;

  @ApiProperty({
    type: [GamePlayerResponseDto],
    minItems: 2,
    maxItems: 2,
  })
  readonly players: readonly [GamePlayerResponseDto, GamePlayerResponseDto];

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  readonly activePlayerId: string;

  @ApiProperty({ example: 7, minimum: 0 })
  readonly roundScore: number;

  @ApiProperty({ example: 100, minimum: 1 })
  readonly winningScore: number;

  @ApiProperty({
    type: [Number],
    minItems: 2,
    maxItems: 2,
    nullable: true,
    example: [3, 4],
  })
  readonly lastRoll: readonly [DieValue, DieValue] | null;

  @ApiProperty({
    enum: ['ROLL', 'BUST', 'HOLD', 'RESTART'],
    nullable: true,
    example: 'BUST',
  })
  readonly lastEvent: GameEvent | null;

  @ApiProperty({ enum: ['active', 'won'] })
  readonly status: GameStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '507f1f77bcf86cd799439011',
  })
  readonly winnerId: string | null;

  @ApiProperty({
    enum: ['roll', 'hold', 'restart'],
    isArray: true,
  })
  readonly allowedActions: readonly AllowedGameAction[];

  constructor(record: GameRecord, actorId: string) {
    const { state } = record;
    const isActorsTurn = state.players[state.activePlayerIndex].id === actorId;

    this.id = record.id;
    this.version = record.version;
    this.players = [{ ...state.players[0] }, { ...state.players[1] }];
    this.activePlayerId = state.players[state.activePlayerIndex].id;
    this.roundScore = state.roundScore;
    this.winningScore = state.winningScore;
    this.lastRoll = state.lastRoll
      ? [state.lastRoll[0], state.lastRoll[1]]
      : null;
    this.lastEvent = state.lastEvent;
    this.status = state.status;
    this.winnerId = state.winnerId;
    this.allowedActions =
      state.status === 'active' && isActorsTurn
        ? ['roll', 'hold', 'restart']
        : ['restart'];
  }
}
