import type { DieValue } from '../domain/dice-roller';
import type { GameStatus } from '../domain/game.types';
import type { GameRecord } from '../repositories/game.repository';

export type AllowedGameAction = 'roll' | 'hold' | 'restart';

export interface GamePlayerResponse {
  readonly id: string;
  readonly globalScore: number;
}

export class GameResponseDto {
  readonly id: string;
  readonly players: readonly [GamePlayerResponse, GamePlayerResponse];
  readonly activePlayerId: string;
  readonly roundScore: number;
  readonly winningScore: number;
  readonly lastRoll: readonly [DieValue, DieValue] | null;
  readonly status: GameStatus;
  readonly winnerId: string | null;
  readonly allowedActions: readonly AllowedGameAction[];

  constructor(record: GameRecord, actorId: string) {
    const { state } = record;
    const isActorsTurn = state.players[state.activePlayerIndex].id === actorId;

    this.id = record.id;
    this.players = [{ ...state.players[0] }, { ...state.players[1] }];
    this.activePlayerId = state.players[state.activePlayerIndex].id;
    this.roundScore = state.roundScore;
    this.winningScore = state.winningScore;
    this.lastRoll = state.lastRoll
      ? [state.lastRoll[0], state.lastRoll[1]]
      : null;
    this.status = state.status;
    this.winnerId = state.winnerId;
    this.allowedActions =
      state.status === 'active' && isActorsTurn
        ? ['roll', 'hold', 'restart']
        : ['restart'];
  }
}
