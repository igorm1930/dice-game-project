import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GameState } from '../domain/game.types';
import type { GameRecord, GameRepository } from './game.repository';
import { GameVersionConflictError } from './game-repository.errors';

@Injectable()
export class InMemoryGameRepository implements GameRepository {
  private readonly games = new Map<string, GameRecord>();

  create(state: GameState): Promise<GameRecord> {
    const record: GameRecord = {
      id: randomUUID(),
      version: 0,
      winEventId: null,
      state,
    };
    this.games.set(record.id, record);
    return Promise.resolve(record);
  }

  findById(id: string): Promise<GameRecord | undefined> {
    return Promise.resolve(this.games.get(id));
  }

  save(record: GameRecord): Promise<GameRecord> {
    const current = this.games.get(record.id);

    if (!current || current.version !== record.version) {
      return Promise.reject(new GameVersionConflictError());
    }

    const storedRecord = { ...record, version: record.version + 1 };
    this.games.set(storedRecord.id, storedRecord);
    return Promise.resolve(storedRecord);
  }
}
