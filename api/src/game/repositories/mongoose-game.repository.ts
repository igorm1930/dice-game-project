import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import type { DiceRoll } from '../domain/dice-roller';
import type { GameState } from '../domain/game.types';
import {
  PersistedGame,
  type PersistedGameDocument,
} from '../schemas/game.schema';
import type { GameRecord, GameRepository } from './game.repository';
import { GameVersionConflictError } from './game-repository.errors';

function cloneState(state: GameState): GameState {
  return {
    players: [{ ...state.players[0] }, { ...state.players[1] }],
    activePlayerIndex: state.activePlayerIndex,
    roundScore: state.roundScore,
    winningScore: state.winningScore,
    lastRoll: state.lastRoll ? [...state.lastRoll] : null,
    status: state.status,
    winnerId: state.winnerId,
  };
}

interface PersistedStateFields {
  readonly players: { readonly id: string; readonly globalScore: number }[];
  readonly activePlayerIndex: GameState['activePlayerIndex'];
  readonly roundScore: number;
  readonly winningScore: number;
  readonly lastRoll: DiceRoll | null;
  readonly status: GameState['status'];
  readonly winnerId: string | null;
}

function persistenceFields(state: GameState): PersistedStateFields {
  return {
    players: state.players.map((player) => ({ ...player })),
    activePlayerIndex: state.activePlayerIndex,
    roundScore: state.roundScore,
    winningScore: state.winningScore,
    lastRoll: state.lastRoll ? [state.lastRoll[0], state.lastRoll[1]] : null,
    status: state.status,
    winnerId: state.winnerId,
  };
}

function toRecord(game: PersistedGameDocument): GameRecord {
  const firstPlayer = game.players[0];
  const secondPlayer = game.players[1];

  if (!firstPlayer || !secondPlayer) {
    throw new Error('Stored game does not contain exactly two players.');
  }

  return {
    id: game._id,
    version: game.version ?? 0,
    state: {
      players: [
        { id: firstPlayer.id, globalScore: firstPlayer.globalScore },
        { id: secondPlayer.id, globalScore: secondPlayer.globalScore },
      ],
      activePlayerIndex: game.activePlayerIndex,
      roundScore: game.roundScore,
      winningScore: game.winningScore,
      lastRoll: game.lastRoll ? [...game.lastRoll] : null,
      status: game.status,
      winnerId: game.winnerId,
    },
  };
}

@Injectable()
export class MongooseGameRepository implements GameRepository {
  constructor(
    @InjectModel(PersistedGame.name)
    private readonly gameModel: Model<PersistedGameDocument>,
  ) {}

  async create(state: GameState): Promise<GameRecord> {
    const id = randomUUID();

    await this.gameModel.create({
      _id: id,
      ...persistenceFields(state),
    });

    return { id, version: 0, state: cloneState(state) };
  }

  async findById(id: string): Promise<GameRecord | undefined> {
    const game = await this.gameModel.findById(id).exec();

    if (!game) {
      return undefined;
    }

    await game.validate();

    return toRecord(game);
  }

  async save(record: GameRecord): Promise<GameRecord> {
    const candidate = this.gameModel.hydrate({
      _id: record.id,
      version: record.version,
      ...persistenceFields(record.state),
    });

    await candidate.validate();

    const versionFilter =
      record.version === 0
        ? { $or: [{ version: 0 }, { version: { $exists: false } }] }
        : { version: record.version };
    const result = await this.gameModel
      .updateOne(
        { _id: record.id, ...versionFilter },
        {
          $set: persistenceFields(record.state),
          $inc: { version: 1 },
        },
        { runValidators: true },
      )
      .exec();

    if (result.matchedCount !== 1) {
      throw new GameVersionConflictError();
    }

    return {
      id: record.id,
      version: record.version + 1,
      state: cloneState(record.state),
    };
  }
}
