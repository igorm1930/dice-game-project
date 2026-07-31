import type { DiceRoll, DiceRoller } from './dice-roller';
import { GameRuleError } from './game-errors';
import {
  DEFAULT_WINNING_SCORE,
  type GamePlayers,
  type GameState,
  type PlayerIndex,
} from './game.types';

export class GameEngine {
  constructor(private readonly diceRoller: DiceRoller) {}

  createGame(
    playerIds: readonly [string, string],
    winningScore = DEFAULT_WINNING_SCORE,
  ): GameState {
    this.validatePlayerIds(playerIds);
    this.validateWinningScore(winningScore);

    return {
      players: [
        { id: playerIds[0], globalScore: 0 },
        { id: playerIds[1], globalScore: 0 },
      ],
      activePlayerIndex: 0,
      roundScore: 0,
      winningScore,
      lastRoll: null,
      status: 'active',
      winnerId: null,
    };
  }

  roll(state: GameState): GameState {
    this.ensureActive(state);

    const dice = this.diceRoller();
    this.validateDiceRoll(dice);

    if (dice[0] === 6 && dice[1] === 6) {
      return {
        ...state,
        players: this.copyPlayers(state.players),
        activePlayerIndex: this.otherPlayer(state.activePlayerIndex),
        roundScore: 0,
        lastRoll: dice,
      };
    }

    return {
      ...state,
      players: this.copyPlayers(state.players),
      roundScore: state.roundScore + dice[0] + dice[1],
      lastRoll: dice,
    };
  }

  hold(state: GameState): GameState {
    this.ensureActive(state);

    const activePlayerIndex = state.activePlayerIndex;
    const nextGlobalScore =
      state.players[activePlayerIndex].globalScore + state.roundScore;
    const players = this.withPlayerScore(
      state.players,
      activePlayerIndex,
      nextGlobalScore,
    );

    if (nextGlobalScore >= state.winningScore) {
      return {
        ...state,
        players,
        roundScore: 0,
        status: 'won',
        winnerId: players[activePlayerIndex].id,
      };
    }

    return {
      ...state,
      players,
      activePlayerIndex: this.otherPlayer(activePlayerIndex),
      roundScore: 0,
    };
  }

  restart(state: GameState): GameState {
    return this.createGame(
      [state.players[0].id, state.players[1].id],
      state.winningScore,
    );
  }

  private ensureActive(state: GameState): void {
    if (state.status !== 'active') {
      throw new GameRuleError(
        'GAME_FINISHED',
        'The game is finished. Start a new game before taking another action.',
      );
    }
  }

  private validatePlayerIds(playerIds: readonly string[]): void {
    if (
      playerIds.length !== 2 ||
      playerIds.some(
        (playerId) => typeof playerId !== 'string' || playerId.trim() === '',
      ) ||
      playerIds[0] === playerIds[1]
    ) {
      throw new GameRuleError(
        'INVALID_PLAYERS',
        'A game requires exactly two distinct, non-empty player IDs.',
      );
    }
  }

  private validateWinningScore(winningScore: number): void {
    if (!Number.isSafeInteger(winningScore) || winningScore <= 0) {
      throw new GameRuleError(
        'INVALID_WINNING_SCORE',
        'The winning score must be a positive safe integer.',
      );
    }
  }

  private validateDiceRoll(dice: DiceRoll): void {
    if (
      !Array.isArray(dice) ||
      dice.length !== 2 ||
      dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6)
    ) {
      throw new GameRuleError(
        'INVALID_DICE_ROLL',
        'The dice roller must return exactly two integer values from 1 through 6.',
      );
    }
  }

  private otherPlayer(playerIndex: PlayerIndex): PlayerIndex {
    return playerIndex === 0 ? 1 : 0;
  }

  private copyPlayers(players: GamePlayers): GamePlayers {
    return [{ ...players[0] }, { ...players[1] }];
  }

  private withPlayerScore(
    players: GamePlayers,
    playerIndex: PlayerIndex,
    globalScore: number,
  ): GamePlayers {
    return playerIndex === 0
      ? [{ ...players[0], globalScore }, { ...players[1] }]
      : [{ ...players[0] }, { ...players[1], globalScore }];
  }
}
