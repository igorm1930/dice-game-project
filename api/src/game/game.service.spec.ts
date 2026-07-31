import { BadRequestException, HttpException } from '@nestjs/common';
import type { UsersService } from '../users/users.service';
import type { DiceRoll, DiceRoller } from './domain/dice-roller';
import { GameEngine } from './domain/game-engine';
import {
  GAME_FINISHED_RESPONSE,
  GAME_NOT_FOUND_RESPONSE,
  NOT_YOUR_TURN_RESPONSE,
  OPPONENT_NOT_FOUND_RESPONSE,
} from './game.constants';
import { GameService } from './game.service';
import { InMemoryGameRepository } from './repositories/in-memory-game.repository';

describe('GameService', () => {
  const playerA = 'player-a';
  const playerB = 'player-b';
  const outsider = 'outsider';
  const findAuthenticatedById = jest.fn();
  const usersService = { findAuthenticatedById } as unknown as UsersService;

  function sequenceDiceRoller(...rolls: DiceRoll[]): DiceRoller {
    const queuedRolls = [...rolls];

    return () => {
      const nextRoll = queuedRolls.shift();

      if (!nextRoll) {
        throw new Error('The deterministic dice sequence is exhausted.');
      }

      return nextRoll;
    };
  }

  function createService(...rolls: DiceRoll[]): GameService {
    return new GameService(
      new InMemoryGameRepository(),
      new GameEngine(sequenceDiceRoller(...rolls)),
      usersService,
    );
  }

  async function expectHttpError(
    action: () => Promise<unknown>,
    expectedResponse: object,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getResponse()).toEqual(expectedResponse);
      return;
    }

    throw new Error('Expected an HTTP exception to be thrown.');
  }

  beforeEach(() => {
    jest.clearAllMocks();
    findAuthenticatedById.mockResolvedValue({ id: playerB });
  });

  it('creates a game with the authenticated caller as Player 1', async () => {
    const service = createService();

    const game = await service.create(playerA, { opponentId: playerB });

    expect(findAuthenticatedById).toHaveBeenCalledWith(playerB);
    expect(game).toEqual({
      id: expect.any(String) as string,
      players: [
        { id: playerA, globalScore: 0 },
        { id: playerB, globalScore: 0 },
      ],
      activePlayerId: playerA,
      roundScore: 0,
      winningScore: 100,
      lastRoll: null,
      status: 'active',
      winnerId: null,
      allowedActions: ['roll', 'hold', 'restart'],
    });
  });

  it('rejects selecting the authenticated caller as the opponent', async () => {
    const service = createService();

    await expect(
      service.create(playerA, { opponentId: playerA }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findAuthenticatedById).not.toHaveBeenCalled();
  });

  it('rejects an opponent who cannot authenticate', async () => {
    findAuthenticatedById.mockResolvedValue(null);
    const service = createService();

    await expect(
      service.create(playerA, { opponentId: playerB }),
    ).rejects.toMatchObject({ response: OPPONENT_NOT_FOUND_RESPONSE });
  });

  it('hides both missing games and participant games from outsiders', async () => {
    const service = createService();
    const game = await service.create(playerA, { opponentId: playerB });

    await expectHttpError(
      () => service.get(game.id, outsider),
      GAME_NOT_FOUND_RESPONSE,
    );
    await expectHttpError(
      () => service.get('00000000-0000-4000-8000-000000000000', playerA),
      GAME_NOT_FOUND_RESPONSE,
    );
  });

  it('uses only the authenticated actor for turn authorization', async () => {
    const service = createService([2, 3]);
    const game = await service.create(playerA, { opponentId: playerB });

    await expectHttpError(
      () => service.roll(game.id, playerB),
      NOT_YOUR_TURN_RESPONSE,
    );

    await expect(service.roll(game.id, playerA)).resolves.toMatchObject({
      activePlayerId: playerA,
      roundScore: 5,
      lastRoll: [2, 3],
    });
  });

  it('banks Hold and returns caller-specific allowed actions', async () => {
    const service = createService([3, 4]);
    const game = await service.create(playerA, { opponentId: playerB });
    const rolled = await service.roll(game.id, playerA);

    const held = await service.hold(rolled.id, playerA);

    expect(held).toMatchObject({
      players: [
        { id: playerA, globalScore: 7 },
        { id: playerB, globalScore: 0 },
      ],
      activePlayerId: playerB,
      roundScore: 0,
      allowedActions: ['restart'],
    });
    await expect(service.get(game.id, playerB)).resolves.toMatchObject({
      allowedActions: ['roll', 'hold', 'restart'],
    });
  });

  it('applies double-six bust behavior through the domain engine', async () => {
    const service = createService([6, 6]);
    const game = await service.create(playerA, { opponentId: playerB });

    await expect(service.roll(game.id, playerA)).resolves.toMatchObject({
      activePlayerId: playerB,
      roundScore: 0,
      lastRoll: [6, 6],
    });
  });

  it('returns the approved conflict after victory', async () => {
    const service = createService([4, 6]);
    const game = await service.create(playerA, {
      opponentId: playerB,
      winningScore: 10,
    });
    await service.roll(game.id, playerA);

    const won = await service.hold(game.id, playerA);

    expect(won).toMatchObject({
      status: 'won',
      winnerId: playerA,
      allowedActions: ['restart'],
    });
    await expectHttpError(
      () => service.roll(game.id, playerA),
      GAME_FINISHED_RESPONSE,
    );
    await expectHttpError(
      () => service.hold(game.id, playerA),
      GAME_FINISHED_RESPONSE,
    );
  });

  it('allows either participant to restart and restores Player 1 turn', async () => {
    const service = createService([2, 3]);
    const game = await service.create(playerA, {
      opponentId: playerB,
      winningScore: 25,
    });
    await service.roll(game.id, playerA);

    await expect(service.restart(game.id, playerB)).resolves.toMatchObject({
      players: [
        { id: playerA, globalScore: 0 },
        { id: playerB, globalScore: 0 },
      ],
      activePlayerId: playerA,
      roundScore: 0,
      winningScore: 25,
      lastRoll: null,
      status: 'active',
      winnerId: null,
      allowedActions: ['restart'],
    });
  });
});
