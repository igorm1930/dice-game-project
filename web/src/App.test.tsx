import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { AuthApiError, getCurrentUser, login, register } from "./api/auth";
import {
  createGame,
  GameApiError,
  getGame,
  holdGame,
  restartGame,
  rollGame,
  type GameResponse,
} from "./api/games";
import { getHealth } from "./api/health";
import { listUsers, type UserResponse } from "./api/users";

vi.mock("./api/health", () => ({ getHealth: vi.fn() }));
vi.mock("./api/users", () => ({ listUsers: vi.fn() }));
vi.mock("./api/games", () => {
  class MockGameApiError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(message: string, status: number, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    GameApiError: MockGameApiError,
    createGame: vi.fn(),
    getGame: vi.fn(),
    rollGame: vi.fn(),
    holdGame: vi.fn(),
    restartGame: vi.fn(),
  };
});
vi.mock("./api/auth", () => {
  class MockAuthApiError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(message: string, status: number, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    AuthApiError: MockAuthApiError,
    register: vi.fn(),
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  };
});

const mockGetHealth = vi.mocked(getHealth);
const mockListUsers = vi.mocked(listUsers);
const mockRegister = vi.mocked(register);
const mockLogin = vi.mocked(login);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCreateGame = vi.mocked(createGame);
const mockGetGame = vi.mocked(getGame);
const mockRollGame = vi.mocked(rollGame);
const mockHoldGame = vi.mocked(holdGame);
const mockRestartGame = vi.mocked(restartGame);

const seatAUser: UserResponse = {
  id: "507f1f77bcf86cd799439011",
  username: "SeatAlpha",
  wins: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const seatBUser: UserResponse = {
  id: "507f1f77bcf86cd799439012",
  username: "SeatBravo",
  wins: 0,
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const game: GameResponse = {
  id: "d43acc2f-a715-49a1-bf4f-74b16592e553",
  version: 0,
  players: [
    { id: seatAUser.id, globalScore: 0 },
    { id: seatBUser.id, globalScore: 0 },
  ],
  activePlayerId: seatAUser.id,
  roundScore: 0,
  winningScore: 25,
  lastRoll: null,
  lastEvent: null,
  status: "active",
  winnerId: null,
  allowedActions: ["roll", "hold", "restart"],
};

function seatRegion(seatName: "Seat A" | "Seat B") {
  const label = screen.getByText(seatName, { selector: ".step" });
  const region = label.closest("section");

  if (!region) throw new Error(`${seatName} region was not found`);

  return within(region);
}

async function signIn(
  actor: ReturnType<typeof userEvent.setup>,
  seatName: "Seat A" | "Seat B",
  username: string,
) {
  const seat = seatRegion(seatName);
  await actor.type(seat.getByLabelText("Username"), username);
  await actor.type(seat.getByLabelText("Password"), "private password");
  await actor.click(
    seat.getByRole("button", { name: `Sign in to ${seatName}` }),
  );
}

function mockTwoLogins() {
  mockLogin
    .mockResolvedValueOnce({
      accessToken: "token-a",
      tokenType: "Bearer",
      expiresIn: 1800,
    })
    .mockResolvedValueOnce({
      accessToken: "token-b",
      tokenType: "Bearer",
      expiresIn: 1800,
    });
  mockGetCurrentUser
    .mockResolvedValueOnce(seatAUser)
    .mockResolvedValueOnce(seatBUser);
}

async function signInBoth(actor: ReturnType<typeof userEvent.setup>) {
  mockTwoLogins();
  await signIn(actor, "Seat A", "SeatAlpha");
  await signIn(actor, "Seat B", "SeatBravo");
}

describe("App", () => {
  beforeEach(() => {
    mockGetHealth.mockResolvedValue({
      status: "ok",
      service: "dice-game-api",
    });
    mockListUsers.mockResolvedValue([]);
    mockRegister.mockReset();
    mockLogin.mockReset();
    mockGetCurrentUser.mockReset();
    mockCreateGame.mockReset();
    mockGetGame.mockReset();
    mockRollGame.mockReset();
    mockHoldGame.mockReset();
    mockRestartGame.mockReset();
  });

  it("shows health and player loading states", () => {
    mockGetHealth.mockReturnValue(new Promise(() => undefined));
    mockListUsers.mockReturnValue(new Promise(() => undefined));

    render(<App />);

    expect(screen.getByText("Checking API...")).toBeInTheDocument();
    expect(screen.getByText("Loading players...")).toBeInTheDocument();
  });

  it("shows connected and empty success states", async () => {
    render(<App />);

    expect(
      await screen.findByText("dice-game-api connected"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("No players saved yet."),
    ).toBeInTheDocument();
  });

  it("renders users returned by the public API", async () => {
    mockListUsers.mockResolvedValue([{ ...seatAUser, wins: 3 }]);

    render(<App />);

    expect(await screen.findByText("SeatAlpha")).toBeInTheDocument();
    expect(await screen.findByText("Wins: 3")).toBeInTheDocument();
  });

  it("shows health and player-list errors", async () => {
    mockGetHealth.mockRejectedValue(new Error("Health offline"));
    mockListUsers.mockRejectedValue(new Error("Users offline"));

    render(<App />);

    expect(
      await screen.findByText("API unavailable: Health offline"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Users offline")).toBeInTheDocument();
  });

  it("registers without creating a session and clears the password field", async () => {
    const actor = userEvent.setup();
    mockRegister.mockResolvedValue(seatAUser);
    render(<App />);

    const seat = seatRegion("Seat A");
    await actor.click(seat.getByRole("button", { name: "Create account" }));
    await actor.type(seat.getByLabelText("Username"), "SeatAlpha");
    await actor.type(seat.getByLabelText("Password"), "private password");
    await actor.click(
      seat.getAllByRole("button", { name: "Create account" }).at(-1)!,
    );

    expect(mockRegister).toHaveBeenCalledWith({
      username: "SeatAlpha",
      password: "private password",
    });
    expect(
      await seat.findByText(/SeatAlpha was registered/),
    ).toBeInTheDocument();
    expect(seat.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByRole("radio", { name: /Seat A/ })).toBeDisabled();
  });

  it("keeps two sessions independent and selects the exact acting-seat token", async () => {
    const actor = userEvent.setup();
    mockLogin
      .mockResolvedValueOnce({
        accessToken: "token-a",
        tokenType: "Bearer",
        expiresIn: 1800,
      })
      .mockResolvedValueOnce({
        accessToken: "token-b",
        tokenType: "Bearer",
        expiresIn: 1800,
      });
    mockGetCurrentUser
      .mockResolvedValueOnce(seatAUser)
      .mockResolvedValueOnce(seatBUser);
    render(<App />);

    await signIn(actor, "Seat A", "SeatAlpha");
    expect(
      await seatRegion("Seat A").findByText(/authenticated as/),
    ).toHaveTextContent("SeatAlpha");
    await signIn(actor, "Seat B", "SeatBravo");
    expect(
      await seatRegion("Seat B").findByText(/authenticated as/),
    ).toHaveTextContent("SeatBravo");

    const seatARadio = screen.getByRole("radio", { name: /Seat A/ });
    const seatBRadio = screen.getByRole("radio", { name: /Seat B/ });
    expect(seatARadio).toBeChecked();

    mockGetCurrentUser.mockResolvedValueOnce(seatBUser);
    await actor.click(seatBRadio);
    await actor.click(
      screen.getByRole("button", { name: "Verify acting identity" }),
    );

    expect(mockGetCurrentUser).toHaveBeenLastCalledWith("token-b");
    expect(
      await screen.findByText(/Backend verified Seat B as/),
    ).toHaveTextContent("SeatBravo");
  });

  it("logs out only one seat and keeps the other seat active", async () => {
    const actor = userEvent.setup();
    mockLogin
      .mockResolvedValueOnce({
        accessToken: "token-a",
        tokenType: "Bearer",
        expiresIn: 1800,
      })
      .mockResolvedValueOnce({
        accessToken: "token-b",
        tokenType: "Bearer",
        expiresIn: 1800,
      });
    mockGetCurrentUser
      .mockResolvedValueOnce(seatAUser)
      .mockResolvedValueOnce(seatBUser);
    render(<App />);

    await signIn(actor, "Seat A", "SeatAlpha");
    await signIn(actor, "Seat B", "SeatBravo");
    await actor.click(
      seatRegion("Seat A").getByRole("button", { name: "Log out Seat A" }),
    );

    expect(
      seatRegion("Seat A").getByRole("button", { name: "Sign in to Seat A" }),
    ).toBeInTheDocument();
    expect(
      seatRegion("Seat B").getByText(/authenticated as/),
    ).toHaveTextContent("SeatBravo");
    expect(screen.getByRole("radio", { name: /Seat B/ })).toBeChecked();
  });

  it("never writes authenticated sessions to browser storage", async () => {
    const actor = userEvent.setup();
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    mockLogin.mockResolvedValue({
      accessToken: "memory-only-token",
      tokenType: "Bearer",
      expiresIn: 1800,
    });
    mockGetCurrentUser.mockResolvedValue(seatAUser);
    render(<App />);

    await signIn(actor, "Seat A", "SeatAlpha");
    await seatRegion("Seat A").findByText(/authenticated as/);

    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("clears only the rejected seat after a protected request returns 401", async () => {
    const actor = userEvent.setup();
    mockLogin.mockResolvedValue({
      accessToken: "expired-token",
      tokenType: "Bearer",
      expiresIn: 1800,
    });
    mockGetCurrentUser.mockResolvedValueOnce(seatAUser);
    render(<App />);

    await signIn(actor, "Seat A", "SeatAlpha");
    mockGetCurrentUser.mockRejectedValueOnce(
      new AuthApiError("Unauthorized", 401),
    );
    await actor.click(
      screen.getByRole("button", { name: "Verify acting identity" }),
    );

    expect(
      await seatRegion("Seat A").findByText(
        "This session expired or is invalid. Sign in again.",
      ),
    ).toBeInTheDocument();
    expect(
      seatRegion("Seat A").getByRole("button", { name: "Sign in to Seat A" }),
    ).toBeInTheDocument();
  });

  it("creates a game from the exact active token and other-seat identity", async () => {
    const actor = userEvent.setup();
    mockCreateGame.mockResolvedValue(game);
    render(<App />);

    await signInBoth(actor);
    const winningScore = screen.getByLabelText("Winning score");
    await actor.clear(winningScore);
    await actor.type(winningScore, "25");
    await actor.click(screen.getByRole("button", { name: "Start game" }));

    expect(mockCreateGame).toHaveBeenCalledWith("token-a", {
      opponentId: seatBUser.id,
      winningScore: 25,
    });
    expect(
      await screen.findByRole("heading", { name: "Game in progress" }),
    ).toBeInTheDocument();
  });

  it("refetches caller-specific permissions when the acting seat changes", async () => {
    const actor = userEvent.setup();
    mockCreateGame.mockResolvedValue(game);
    mockGetGame.mockResolvedValue({
      ...game,
      allowedActions: ["restart"],
    });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("radio", { name: /Seat B/ }));

    await waitFor(() => {
      expect(mockGetGame).toHaveBeenCalledWith("token-b", game.id);
    });
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeEnabled();
  });

  it("sends game actions with the active token and renders returned state", async () => {
    const actor = userEvent.setup();
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockResolvedValue({
      ...game,
      version: 1,
      roundScore: 5,
      lastRoll: [2, 3],
      lastEvent: "ROLL",
    });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("button", { name: "Roll dice" }));

    expect(mockRollGame).toHaveBeenCalledWith("token-a", game.id, game.version);
    expect(
      await screen.findByText("5", { selector: ".round-score strong" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Die 1: 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Die 2: 3")).toBeInTheDocument();
  });

  it("hands control to the next authenticated seat after double six", async () => {
    const actor = userEvent.setup();
    const bustForPreviousPlayer: GameResponse = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      roundScore: 0,
      lastRoll: [6, 6],
      lastEvent: "BUST",
      allowedActions: ["restart"],
    };
    const bustForActivePlayer: GameResponse = {
      ...bustForPreviousPlayer,
      allowedActions: ["roll", "hold", "restart"],
    };
    const nextPlayerRoll: GameResponse = {
      ...bustForActivePlayer,
      version: 2,
      roundScore: 5,
      lastRoll: [2, 3],
      lastEvent: "ROLL",
    };
    const holdForPreviousPlayer: GameResponse = {
      ...nextPlayerRoll,
      version: 3,
      players: [
        { id: seatAUser.id, globalScore: 0 },
        { id: seatBUser.id, globalScore: 5 },
      ],
      activePlayerId: seatAUser.id,
      roundScore: 0,
      lastEvent: "HOLD",
      allowedActions: ["restart"],
    };
    mockCreateGame.mockResolvedValue(game);
    mockRollGame
      .mockResolvedValueOnce(bustForPreviousPlayer)
      .mockResolvedValueOnce(nextPlayerRoll);
    mockHoldGame.mockResolvedValue(holdForPreviousPlayer);
    mockGetGame
      .mockResolvedValueOnce(bustForActivePlayer)
      .mockResolvedValueOnce({
        ...holdForPreviousPlayer,
        allowedActions: ["roll", "hold", "restart"],
      });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("button", { name: "Roll dice" }));

    expect(mockRollGame).toHaveBeenCalledWith("token-a", game.id, game.version);
    await waitFor(() => {
      expect(mockGetGame).toHaveBeenCalledWith("token-b", game.id);
      expect(screen.getByRole("radio", { name: /Seat B/ })).toBeChecked();
    });
    expect(
      screen.getByText("SeatBravo", { selector: ".game-heading strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("0", { selector: ".round-score strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bust! The round score was lost/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeEnabled();

    await actor.click(screen.getByRole("button", { name: "Roll dice" }));
    expect(mockRollGame).toHaveBeenNthCalledWith(2, "token-b", game.id, 1);
    expect(
      await screen.findByText("5", { selector: ".round-score strong" }),
    ).toBeInTheDocument();

    await actor.click(screen.getByRole("button", { name: "Hold score" }));
    expect(mockHoldGame).toHaveBeenCalledWith("token-b", game.id, 2);
    await waitFor(() => {
      expect(mockGetGame).toHaveBeenCalledWith("token-a", game.id);
      expect(screen.getByRole("radio", { name: /Seat A/ })).toBeChecked();
    });
    expect(mockCreateGame).toHaveBeenCalledTimes(1);
  });

  it("reloads the latest state after a version conflict", async () => {
    const actor = userEvent.setup();
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockRejectedValue(
      new GameApiError(
        "The game changed. Load the latest state before trying again.",
        409,
        "GAME_STATE_CONFLICT",
      ),
    );
    mockGetGame.mockResolvedValue({
      ...game,
      version: 1,
      roundScore: 5,
      lastRoll: [2, 3],
    });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("button", { name: "Roll dice" }));

    expect(await screen.findByText(/Latest state loaded/)).toBeInTheDocument();
    expect(mockGetGame).toHaveBeenCalledWith("token-a", game.id);
    expect(
      screen.getByText("5", { selector: ".round-score strong" }),
    ).toBeInTheDocument();
  });

  it("refreshes and displays lifetime wins after victory", async () => {
    const actor = userEvent.setup();
    mockListUsers
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...seatAUser, wins: 1 }, seatBUser]);
    mockCreateGame.mockResolvedValue(game);
    mockHoldGame.mockResolvedValue({
      ...game,
      version: 1,
      status: "won",
      winnerId: seatAUser.id,
      allowedActions: ["restart"],
    });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("button", { name: "Hold score" }));

    expect(await screen.findByText("SeatAlpha wins")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "SeatAlpha reached the target. Lifetime wins: 1. Start a new game to play again.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("Wins: 1")).toHaveLength(2);
    expect(mockHoldGame).toHaveBeenCalledWith("token-a", game.id, game.version);
  });

  it("refreshes lifetime wins when a won game is loaded", async () => {
    const actor = userEvent.setup();
    mockListUsers
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...seatAUser, wins: 4 }, seatBUser]);
    mockCreateGame.mockResolvedValue(game);
    mockGetGame.mockResolvedValue({
      ...game,
      version: 2,
      status: "won",
      winnerId: seatAUser.id,
      allowedActions: ["restart"],
    });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("radio", { name: /Seat B/ }));

    expect(
      await screen.findByText(
        "SeatAlpha reached the target. Lifetime wins: 4. Start a new game to play again.",
      ),
    ).toBeInTheDocument();
    expect(mockListUsers).toHaveBeenCalledTimes(2);
  });

  it("returns to setup when a game is no longer available", async () => {
    const actor = userEvent.setup();
    mockCreateGame.mockResolvedValue(game);
    mockGetGame.mockRejectedValue(
      new GameApiError("Game not found.", 404, "GAME_NOT_FOUND"),
    );
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("radio", { name: /Seat B/ }));

    expect(
      await screen.findByText(
        "This game is no longer available. Start a new game.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Start a new game" }),
    ).toBeInTheDocument();
  });

  it("clears only a seat rejected by a game request", async () => {
    const actor = userEvent.setup();
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockRejectedValue(
      new GameApiError("Authentication required.", 401, "UNAUTHORIZED"),
    );
    mockGetGame.mockResolvedValue({
      ...game,
      allowedActions: ["restart"],
    });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("button", { name: "Roll dice" }));

    expect(
      await seatRegion("Seat A").findByRole("button", {
        name: "Sign in to Seat A",
      }),
    ).toBeInTheDocument();
    expect(
      seatRegion("Seat B").getByText(/authenticated as/),
    ).toHaveTextContent("SeatBravo");
    await waitFor(() => {
      expect(mockGetGame).toHaveBeenCalledWith("token-b", game.id);
    });
  });
});
