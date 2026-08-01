import { config } from "../config";

export type AllowedGameAction = "roll" | "hold" | "restart";
export type GameStatus = "active" | "won";

export interface GamePlayerResponse {
  id: string;
  globalScore: number;
}

export interface GameResponse {
  id: string;
  version: number;
  players: [GamePlayerResponse, GamePlayerResponse];
  activePlayerId: string;
  roundScore: number;
  winningScore: number;
  lastRoll: [number, number] | null;
  status: GameStatus;
  winnerId: string | null;
  allowedActions: AllowedGameAction[];
}

export interface CreateGameInput {
  opponentId: string;
  winningScore: number;
}

export class GameApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "GameApiError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPlayer(value: unknown): value is GamePlayerResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isNonNegativeSafeInteger(value.globalScore)
  );
}

function isDie(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 6
  );
}

function isLastRoll(value: unknown): value is [number, number] | null {
  return (
    value === null ||
    (Array.isArray(value) &&
      value.length === 2 &&
      isDie(value[0]) &&
      isDie(value[1]))
  );
}

function isAllowedAction(value: unknown): value is AllowedGameAction {
  return value === "roll" || value === "hold" || value === "restart";
}

function isGameResponse(value: unknown): value is GameResponse {
  if (!isRecord(value) || !Array.isArray(value.players)) {
    return false;
  }

  if (
    value.players.length !== 2 ||
    !isPlayer(value.players[0]) ||
    !isPlayer(value.players[1]) ||
    value.players[0].id === value.players[1].id
  ) {
    return false;
  }

  const playerIds = value.players.map((player) => player.id);
  const allowedActions = value.allowedActions;
  const winnerIsValid =
    (value.status === "active" && value.winnerId === null) ||
    (value.status === "won" &&
      typeof value.winnerId === "string" &&
      playerIds.includes(value.winnerId));

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isNonNegativeSafeInteger(value.version) &&
    typeof value.activePlayerId === "string" &&
    playerIds.includes(value.activePlayerId) &&
    isNonNegativeSafeInteger(value.roundScore) &&
    typeof value.winningScore === "number" &&
    Number.isSafeInteger(value.winningScore) &&
    value.winningScore > 0 &&
    isLastRoll(value.lastRoll) &&
    (value.status === "active" || value.status === "won") &&
    winnerIsValid &&
    Array.isArray(allowedActions) &&
    allowedActions.length > 0 &&
    allowedActions.every(isAllowedAction) &&
    new Set(allowedActions).size === allowedActions.length
  );
}

async function readError(response: Response): Promise<GameApiError> {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const data: unknown = await response.json();

    if (isRecord(data)) {
      const message = Array.isArray(data.message)
        ? data.message
            .filter((item): item is string => typeof item === "string")
            .join(". ")
        : data.message;

      return new GameApiError(
        typeof message === "string" && message ? message : fallback,
        response.status,
        typeof data.code === "string" ? data.code : undefined,
      );
    }
  } catch {
    return new GameApiError(fallback, response.status);
  }

  return new GameApiError(fallback, response.status);
}

async function readGame(response: Response): Promise<GameResponse> {
  if (!response.ok) {
    throw await readError(response);
  }

  const data: unknown = await response.json();

  if (!isGameResponse(data)) {
    throw new Error("Game response has an unexpected format");
  }

  return data;
}

function authorization(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function createGame(
  accessToken: string,
  input: CreateGameInput,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const response = await fetch(`${config.apiUrl}/api/games`, {
    method: "POST",
    headers: {
      ...authorization(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });

  return readGame(response);
}

export async function getGame(
  accessToken: string,
  gameId: string,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const response = await fetch(`${config.apiUrl}/api/games/${gameId}`, {
    headers: authorization(accessToken),
    signal,
  });

  return readGame(response);
}

async function performAction(
  action: AllowedGameAction,
  accessToken: string,
  gameId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const response = await fetch(
    `${config.apiUrl}/api/games/${gameId}/${action}`,
    {
      method: "POST",
      headers: {
        ...authorization(accessToken),
        "Content-Type": "application/json",
        "If-Match": JSON.stringify(String(expectedVersion)),
      },
      body: JSON.stringify({}),
      signal,
    },
  );

  return readGame(response);
}

export function rollGame(
  accessToken: string,
  gameId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  return performAction("roll", accessToken, gameId, expectedVersion, signal);
}

export function holdGame(
  accessToken: string,
  gameId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  return performAction("hold", accessToken, gameId, expectedVersion, signal);
}

export function restartGame(
  accessToken: string,
  gameId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  return performAction("restart", accessToken, gameId, expectedVersion, signal);
}
