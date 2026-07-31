import type { Model } from 'mongoose';
import type { GameState } from '../domain/game.types';
import type { PersistedGameDocument } from '../schemas/game.schema';
import type { GameRecord } from './game.repository';
import { MongooseGameRepository } from './mongoose-game.repository';

describe('MongooseGameRepository', () => {
  const playerA = '66c10cb50d521a70d4d8d111';
  const playerB = '66c10cb50d521a70d4d8d222';
  const gameId = 'd43acc2f-a715-49a1-bf4f-74b16592e553';
  const state: GameState = {
    players: [
      { id: playerA, globalScore: 5 },
      { id: playerB, globalScore: 0 },
    ],
    activePlayerIndex: 1,
    roundScore: 0,
    winningScore: 25,
    lastRoll: [2, 3],
    status: 'active',
    winnerId: null,
  };
  const create = jest.fn();
  const hydrate = jest.fn();
  const findById = jest.fn();
  const updateOne = jest.fn();
  const validate = jest.fn();
  const gameModel = {
    create,
    hydrate,
    findById,
    updateOne,
  } as unknown as Model<PersistedGameDocument>;
  let repository: MongooseGameRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    validate.mockResolvedValue(undefined);
    hydrate.mockReturnValue({ validate });
    repository = new MongooseGameRepository(gameModel);
  });

  it('creates a UUID record with the complete domain state', async () => {
    create.mockResolvedValue({});

    const record = await repository.create(state);

    expect(record.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(create).toHaveBeenCalledWith({
      _id: record.id,
      players: [
        { id: playerA, globalScore: 5 },
        { id: playerB, globalScore: 0 },
      ],
      activePlayerIndex: 1,
      roundScore: 0,
      winningScore: 25,
      lastRoll: [2, 3],
      status: 'active',
      winnerId: null,
    });
    expect(record.state).toEqual(state);
    expect(record.state).not.toBe(state);
  });

  it('rehydrates a stored document as a domain record', async () => {
    const documentValidate = jest.fn().mockResolvedValue(undefined);
    const exec = jest.fn().mockResolvedValue({
      _id: gameId,
      ...state,
      validate: documentValidate,
    });
    findById.mockReturnValue({ exec });

    await expect(repository.findById(gameId)).resolves.toEqual({
      id: gameId,
      state,
    });
    expect(findById).toHaveBeenCalledWith(gameId);
    expect(documentValidate).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when no stored game exists', async () => {
    findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(repository.findById(gameId)).resolves.toBeUndefined();
  });

  it('persists and returns the complete replacement state', async () => {
    const record: GameRecord = { id: gameId, state };
    const exec = jest.fn().mockResolvedValue({ matchedCount: 1 });
    updateOne.mockReturnValue({ exec });

    await expect(repository.save(record)).resolves.toEqual(record);
    expect(hydrate).toHaveBeenCalledWith({
      _id: gameId,
      players: [
        { id: playerA, globalScore: 5 },
        { id: playerB, globalScore: 0 },
      ],
      activePlayerIndex: 1,
      roundScore: 0,
      winningScore: 25,
      lastRoll: [2, 3],
      status: 'active',
      winnerId: null,
    });
    expect(validate).toHaveBeenCalledTimes(1);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: gameId },
      {
        $set: {
          players: [
            { id: playerA, globalScore: 5 },
            { id: playerB, globalScore: 0 },
          ],
          activePlayerIndex: 1,
          roundScore: 0,
          winningScore: 25,
          lastRoll: [2, 3],
          status: 'active',
          winnerId: null,
        },
      },
      { runValidators: true },
    );
  });

  it('fails clearly if a game disappears before save', async () => {
    updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ matchedCount: 0 }),
    });

    await expect(repository.save({ id: gameId, state })).rejects.toThrow(
      'Game record disappeared before it could be saved.',
    );
  });
});
