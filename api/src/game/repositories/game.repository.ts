import type { GameState } from '../domain/game.types';

export interface GameRecord {
  readonly id: string;
  readonly version: number;
  readonly winEventId: string | null;
  readonly state: GameState;
}

export interface GameRepository {
  create(state: GameState): Promise<GameRecord>;
  findById(id: string): Promise<GameRecord | undefined>;
  save(record: GameRecord): Promise<GameRecord>;
}
