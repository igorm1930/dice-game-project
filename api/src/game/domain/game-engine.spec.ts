import type { DiceRoll, DiceRoller } from './dice-roller';
import { GameEngine } from './game-engine';
import { GameRuleError, type GameRuleErrorCode } from './game-errors';
import { DEFAULT_WINNING_SCORE, type GameState } from './game.types';
import { CombinationBustGameRules } from '../rules/combination-bust-game-rules';
import { doubleSixV1GameRules } from '../rules/game-rules.registry';

describe('GameEngine', () => {
  const players = ['player-a', 'player-b'] as const;

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

  function expectRuleError(
    action: () => unknown,
    expectedCode: GameRuleErrorCode,
  ): GameRuleError {
    try {
      action();
    } catch (error) {
      expect(error).toBeInstanceOf(GameRuleError);
      expect(error).toMatchObject({ code: expectedCode });
      return error as GameRuleError;
    }

    throw new Error(`Expected ${expectedCode} to be thrown.`);
  }

  function winGame(engine: GameEngine, winningScore = 5): GameState {
    const game = engine.createGame(players, doubleSixV1GameRules, winningScore);
    return engine.hold(engine.roll(game, doubleSixV1GameRules));
  }

  it('creates a two-player game with the default initial state', () => {
    const engine = new GameEngine(sequenceDiceRoller());

    expect(engine.createGame(players, doubleSixV1GameRules)).toEqual({
      players: [
        { id: 'player-a', globalScore: 0 },
        { id: 'player-b', globalScore: 0 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      winningScore: DEFAULT_WINNING_SCORE,
      ruleSetId: 'double-six-v1',
      lastRoll: null,
      lastEvent: null,
      status: 'active',
      winnerId: null,
    });
  });

  it('accepts a custom positive safe-integer winning score', () => {
    const engine = new GameEngine(sequenceDiceRoller());

    expect(
      engine.createGame(players, doubleSixV1GameRules, 25).winningScore,
    ).toBe(25);
  });

  it.each([
    ['too few players', ['player-a']],
    ['too many players', ['player-a', 'player-b', 'player-c']],
    ['an empty player ID', ['', 'player-b']],
    ['a whitespace-only player ID', ['player-a', '   ']],
    ['duplicate player IDs', ['player-a', 'player-a']],
  ])('rejects %s', (_caseName, invalidPlayers) => {
    const engine = new GameEngine(sequenceDiceRoller());

    expectRuleError(
      () =>
        engine.createGame(
          invalidPlayers as unknown as readonly [string, string],
          doubleSixV1GameRules,
        ),
      'INVALID_PLAYERS',
    );
  });

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY, Number.MAX_VALUE])(
    'rejects invalid winning score %s',
    (winningScore) => {
      const engine = new GameEngine(sequenceDiceRoller());

      expectRuleError(
        () => engine.createGame(players, doubleSixV1GameRules, winningScore),
        'INVALID_WINNING_SCORE',
      );
    },
  );

  it('uses injected dice and accumulates repeated non-double-six rolls', () => {
    const diceRoller = jest
      .fn<DiceRoller>()
      .mockReturnValueOnce([2, 3])
      .mockReturnValueOnce([6, 1]);
    const engine = new GameEngine(diceRoller);
    const game = engine.createGame(players, doubleSixV1GameRules);

    const firstRoll = engine.roll(game, doubleSixV1GameRules);
    const secondRoll = engine.roll(firstRoll, doubleSixV1GameRules);

    expect(firstRoll).toMatchObject({
      activePlayerIndex: 0,
      roundScore: 5,
      lastRoll: [2, 3],
      lastEvent: 'ROLL',
      status: 'active',
      winnerId: null,
    });
    expect(secondRoll).toMatchObject({
      activePlayerIndex: 0,
      roundScore: 12,
      lastRoll: [6, 1],
      lastEvent: 'ROLL',
      status: 'active',
      winnerId: null,
    });
    expect(diceRoller).toHaveBeenCalledTimes(2);
  });

  it('treats only double six as a bust and preserves banked scores', () => {
    const engine = new GameEngine(sequenceDiceRoller([2, 3], [4, 5], [6, 6]));
    const game = engine.createGame(players, doubleSixV1GameRules);
    const afterPlayerAHolds = engine.hold(
      engine.roll(game, doubleSixV1GameRules),
    );
    const playerBRoll = engine.roll(afterPlayerAHolds, doubleSixV1GameRules);

    const bust = engine.roll(playerBRoll, doubleSixV1GameRules);

    expect(bust).toMatchObject({
      players: [
        { id: 'player-a', globalScore: 5 },
        { id: 'player-b', globalScore: 0 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      lastRoll: [6, 6],
      lastEvent: 'BUST',
      status: 'active',
      winnerId: null,
    });
  });

  it('banks the round score, preserves the last roll, and switches turns on Hold', () => {
    const engine = new GameEngine(sequenceDiceRoller([3, 4]));
    const game = engine.roll(
      engine.createGame(players, doubleSixV1GameRules),
      doubleSixV1GameRules,
    );

    const held = engine.hold(game);

    expect(held).toMatchObject({
      players: [
        { id: 'player-a', globalScore: 7 },
        { id: 'player-b', globalScore: 0 },
      ],
      activePlayerIndex: 1,
      roundScore: 0,
      lastRoll: [3, 4],
      lastEvent: 'HOLD',
      status: 'active',
      winnerId: null,
    });
  });

  it('allows Hold with zero round score and switches turns', () => {
    const engine = new GameEngine(sequenceDiceRoller());

    const held = engine.hold(engine.createGame(players, doubleSixV1GameRules));

    expect(held.players).toEqual([
      { id: 'player-a', globalScore: 0 },
      { id: 'player-b', globalScore: 0 },
    ]);
    expect(held.activePlayerIndex).toBe(1);
    expect(held.roundScore).toBe(0);
  });

  it('does not declare a winner until the active player holds', () => {
    const engine = new GameEngine(sequenceDiceRoller([6, 5]));
    const game = engine.createGame(players, doubleSixV1GameRules, 10);

    const rolled = engine.roll(game, doubleSixV1GameRules);

    expect(rolled.roundScore).toBe(11);
    expect(rolled.status).toBe('active');
    expect(rolled.winnerId).toBeNull();
    expect(rolled.players[0].globalScore).toBe(0);
  });

  it.each([
    ['at the target', [4, 6] as const, 10],
    ['above the target', [6, 5] as const, 10],
  ])('declares the holding player the winner %s', (_caseName, dice, target) => {
    const engine = new GameEngine(sequenceDiceRoller(dice));

    const won = engine.hold(
      engine.roll(
        engine.createGame(players, doubleSixV1GameRules, target),
        doubleSixV1GameRules,
      ),
    );

    expect(won).toMatchObject({
      players: [
        { id: 'player-a', globalScore: dice[0] + dice[1] },
        { id: 'player-b', globalScore: 0 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      lastRoll: dice,
      lastEvent: 'HOLD',
      status: 'won',
      winnerId: 'player-a',
    });
  });

  it('banks Player 2 score and declares Player 2 the winner', () => {
    const engine = new GameEngine(sequenceDiceRoller([3, 4]));
    const playerBTurn = engine.hold(
      engine.createGame(players, doubleSixV1GameRules, 7),
    );

    const won = engine.hold(engine.roll(playerBTurn, doubleSixV1GameRules));

    expect(won).toMatchObject({
      players: [
        { id: 'player-a', globalScore: 0 },
        { id: 'player-b', globalScore: 7 },
      ],
      activePlayerIndex: 1,
      roundScore: 0,
      status: 'won',
      winnerId: 'player-b',
    });
  });

  it('rejects Roll and Hold after the game is won', () => {
    const engine = new GameEngine(sequenceDiceRoller([2, 3], [1, 1]));
    const won = winGame(engine);

    expectRuleError(
      () => engine.roll(won, doubleSixV1GameRules),
      'GAME_FINISHED',
    );
    expectRuleError(() => engine.hold(won), 'GAME_FINISHED');
  });

  it.each([
    null,
    [1] as unknown as DiceRoll,
    [0, 1] as unknown as DiceRoll,
    [1, 7] as unknown as DiceRoll,
    [1.5, 2] as unknown as DiceRoll,
  ])('rejects invalid injected dice result %p', (invalidRoll) => {
    const engine = new GameEngine((() => invalidRoll) as unknown as DiceRoller);
    const game = engine.createGame(players, doubleSixV1GameRules);

    expectRuleError(
      () => engine.roll(game, doubleSixV1GameRules),
      'INVALID_DICE_ROLL',
    );
  });

  it('restarts an active game with the same players and winning score', () => {
    const engine = new GameEngine(sequenceDiceRoller([2, 4]));
    const game = engine.roll(
      engine.createGame(players, doubleSixV1GameRules, 42),
      doubleSixV1GameRules,
    );

    expect(engine.restart(game)).toEqual({
      players: [
        { id: 'player-a', globalScore: 0 },
        { id: 'player-b', globalScore: 0 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      winningScore: 42,
      ruleSetId: 'double-six-v1',
      lastRoll: null,
      lastEvent: 'RESTART',
      status: 'active',
      winnerId: null,
    });
  });

  it('restarts a completed game', () => {
    const engine = new GameEngine(sequenceDiceRoller([2, 3]));
    const won = winGame(engine);

    expect(engine.restart(won)).toMatchObject({
      players: [
        { id: 'player-a', globalScore: 0 },
        { id: 'player-b', globalScore: 0 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      lastRoll: null,
      lastEvent: 'RESTART',
      status: 'active',
      winnerId: null,
    });
  });

  it('returns new state and player objects without mutating earlier states', () => {
    const engine = new GameEngine(sequenceDiceRoller([2, 3]));
    const initial = engine.createGame(players, doubleSixV1GameRules);

    const rolled = engine.roll(initial, doubleSixV1GameRules);
    const held = engine.hold(rolled);

    expect(initial).toEqual({
      players: [
        { id: 'player-a', globalScore: 0 },
        { id: 'player-b', globalScore: 0 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      winningScore: 100,
      ruleSetId: 'double-six-v1',
      lastRoll: null,
      lastEvent: null,
      status: 'active',
      winnerId: null,
    });
    expect(rolled.roundScore).toBe(5);
    expect(rolled.players[0].globalScore).toBe(0);
    expect(held.players[0].globalScore).toBe(5);
    expect(rolled).not.toBe(initial);
    expect(rolled.players).not.toBe(initial.players);
    expect(held).not.toBe(rolled);
    expect(held.players).not.toBe(rolled.players);
  });

  it('follows a substituted policy without knowing concrete bust combinations', () => {
    const customRules = new CombinationBustGameRules(
      'engine-independence-test',
      [[5, 6]],
    );
    const engine = new GameEngine(sequenceDiceRoller([2, 3], [6, 5], [6, 6]));
    const initial = engine.createGame(players, customRules);
    const scored = engine.roll(initial, customRules);
    const bust = engine.roll(scored, customRules);
    const doubleSixScores = engine.roll(bust, customRules);

    expect(bust).toMatchObject({
      activePlayerIndex: 1,
      roundScore: 0,
      lastRoll: [6, 5],
      lastEvent: 'BUST',
      status: 'active',
      winnerId: null,
    });
    expect(doubleSixScores).toMatchObject({
      activePlayerIndex: 1,
      roundScore: 12,
      lastRoll: [6, 6],
      lastEvent: 'ROLL',
    });
  });
});
