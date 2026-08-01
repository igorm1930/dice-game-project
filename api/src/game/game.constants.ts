export const GAME_REPOSITORY = Symbol('GAME_REPOSITORY');
export const DICE_ROLLER = Symbol('DICE_ROLLER');

export const GAME_NOT_FOUND_RESPONSE = {
  statusCode: 404,
  code: 'GAME_NOT_FOUND',
  message: 'Game not found.',
} as const;

export const OPPONENT_NOT_FOUND_RESPONSE = {
  statusCode: 404,
  code: 'OPPONENT_NOT_FOUND',
  message: 'Opponent not found.',
} as const;

export const INVALID_PLAYERS_RESPONSE = {
  statusCode: 400,
  code: 'INVALID_PLAYERS',
  message: 'A game requires two different authenticated players.',
} as const;

export const NOT_YOUR_TURN_RESPONSE = {
  statusCode: 409,
  code: 'NOT_YOUR_TURN',
  message: 'It is not your turn.',
} as const;

export const GAME_FINISHED_RESPONSE = {
  statusCode: 409,
  code: 'GAME_FINISHED',
  message: 'The game is finished. Restart before taking another action.',
} as const;

export const INVALID_GAME_VERSION_RESPONSE = {
  statusCode: 400,
  code: 'INVALID_GAME_VERSION',
  message: 'If-Match must contain the current quoted game version.',
} as const;

export const GAME_STATE_CONFLICT_RESPONSE = {
  statusCode: 409,
  code: 'GAME_STATE_CONFLICT',
  message: 'The game changed. Load the latest state before trying again.',
} as const;
