import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGame,
  getGame,
  holdGame,
  restartGame,
  rollGame,
  type GameResponse,
} from "./games";

vi.mock("../config", () => ({
  config: { apiUrl: "http://localhost:3000" },
}));

const game: GameResponse = {
  id: "d43acc2f-a715-49a1-bf4f-74b16592e553",
  version: 0,
  players: [
    { id: "507f1f77bcf86cd799439011", globalScore: 0 },
    { id: "507f1f77bcf86cd799439012", globalScore: 0 },
  ],
  activePlayerId: "507f1f77bcf86cd799439011",
  roundScore: 0,
  winningScore: 100,
  lastRoll: null,
  status: "active",
  winnerId: null,
  allowedActions: ["roll", "hold", "restart"],
};

function gameResponse(value: unknown = game, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("game API client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("creates a game with the selected token and approved input only", async () => {
    fetchMock.mockResolvedValue(gameResponse(game, 201));

    await expect(
      createGame("seat-a-token", {
        opponentId: "507f1f77bcf86cd799439012",
        winningScore: 25,
      }),
    ).resolves.toEqual(game);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/games",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer seat-a-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opponentId: "507f1f77bcf86cd799439012",
          winningScore: 25,
        }),
      }),
    );
  });

  it("gets caller-specific game state with the selected token", async () => {
    fetchMock.mockResolvedValue(gameResponse());

    await expect(getGame("seat-b-token", game.id)).resolves.toEqual(game);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/api/games/${game.id}`,
      expect.objectContaining({
        headers: { Authorization: "Bearer seat-b-token" },
      }),
    );
  });

  it.each([
    ["roll", rollGame],
    ["hold", holdGame],
    ["restart", restartGame],
  ] as const)(
    "posts an empty body for the %s action",
    async (action, request) => {
      fetchMock.mockResolvedValue(gameResponse());

      await expect(
        request("selected-token", game.id, game.version),
      ).resolves.toEqual(game);

      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:3000/api/games/${game.id}/${action}`,
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer selected-token",
            "Content-Type": "application/json",
            "If-Match": JSON.stringify(String(game.version)),
          },
          body: JSON.stringify({}),
        }),
      );
    },
  );

  it("preserves a safe backend status, code, and message", async () => {
    fetchMock.mockResolvedValue(
      gameResponse(
        {
          statusCode: 409,
          code: "NOT_YOUR_TURN",
          message: "It is not your turn.",
        },
        409,
      ),
    );

    await expect(
      rollGame("seat-b-token", game.id, game.version),
    ).rejects.toMatchObject({
      status: 409,
      code: "NOT_YOUR_TURN",
      message: "It is not your turn.",
    });
  });

  it.each([
    { ...game, players: [game.players[0]] },
    { ...game, version: -1 },
    { ...game, activePlayerId: "unknown-player" },
    { ...game, lastRoll: [0, 7] },
    { ...game, status: "won", winnerId: null },
    { ...game, allowedActions: ["roll", "roll"] },
  ])("rejects a malformed successful response", async (malformedGame) => {
    fetchMock.mockResolvedValue(gameResponse(malformedGame));

    await expect(getGame("seat-a-token", game.id)).rejects.toThrow(
      "Game response has an unexpected format",
    );
  });
});
