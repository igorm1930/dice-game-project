import type { GameState } from '../domain/game.types';

export interface GameRecord {
  readonly id: string;
  readonly state: GameState;
}

export interface GameRepository {
  create(state: GameState): Promise<GameRecord>;
  findById(id: string): Promise<GameRecord | undefined>;
  save(record: GameRecord): Promise<GameRecord>;
}
