import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GameState } from '../domain/game.types';
import type { GameRecord, GameRepository } from './game.repository';

@Injectable()
export class InMemoryGameRepository implements GameRepository {
  private readonly games = new Map<string, GameRecord>();

  create(state: GameState): Promise<GameRecord> {
    const record = { id: randomUUID(), state };
    this.games.set(record.id, record);
    return Promise.resolve(record);
  }

  findById(id: string): Promise<GameRecord | undefined> {
    return Promise.resolve(this.games.get(id));
  }

  save(record: GameRecord): Promise<GameRecord> {
    const storedRecord = { ...record };
    this.games.set(storedRecord.id, storedRecord);
    return Promise.resolve(storedRecord);
  }
}
