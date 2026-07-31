import type { DiceRoll } from './dice-roller';

export const DEFAULT_WINNING_SCORE = 100;

export type PlayerIndex = 0 | 1;

export type GameStatus = 'active' | 'won';

export interface GamePlayer {
  readonly id: string;
  readonly globalScore: number;
}

export type GamePlayers = readonly [GamePlayer, GamePlayer];

export interface GameState {
  readonly players: GamePlayers;
  readonly activePlayerIndex: PlayerIndex;
  readonly roundScore: number;
  readonly winningScore: number;
  readonly lastRoll: DiceRoll | null;
  readonly status: GameStatus;
  readonly winnerId: string | null;
}
