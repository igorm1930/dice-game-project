import type { GameState } from '../domain/game.types';

export interface GameRecord {
  readonly id: string;
  readonly state: GameState;
}

export interface GameRepository {
  create(state: GameState): GameRecord;
  findById(id: string): GameRecord | undefined;
  save(record: GameRecord): GameRecord;
}
