export type GameRuleErrorCode =
  | 'INVALID_PLAYERS'
  | 'INVALID_WINNING_SCORE'
  | 'INVALID_DICE_ROLL'
  | 'GAME_FINISHED';

export class GameRuleError extends Error {
  constructor(
    public readonly code: GameRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameRuleError';
  }
}
