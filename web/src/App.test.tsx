import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

async function advanceCooldown(milliseconds: number) {
  let remaining = milliseconds;

  while (remaining > 0) {
    const step = Math.min(1_000, remaining);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(step);
    });
    remaining -= step;
  }
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

  afterEach(() => {
    vi.useRealTimers();
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
    expect(screen.queryByText(/turn begins in/i)).not.toBeInTheDocument();
  });

  it("hands control to the next authenticated seat after double six", async () => {
    const actor = userEvent.setup();
    const bustForPreviousPlayer: GameResponse = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      roundScore: 0,
      lastRoll: [2, 5],
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
      .mockResolvedValueOnce(bustForPreviousPlayer)
      .mockResolvedValueOnce(bustForActivePlayer)
      .mockResolvedValueOnce({
        ...holdForPreviousPlayer,
        allowedActions: ["roll", "hold", "restart"],
      });
    const { rerender } = render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
    });

    expect(mockRollGame).toHaveBeenCalledWith("token-a", game.id, game.version);
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGetGame).toHaveBeenCalledWith("token-b", game.id);
    expect(screen.getByRole("radio", { name: /Seat B/ })).toBeChecked();
    expect(
      screen.getByText("SeatBravo", { selector: ".game-heading strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("0", { selector: ".round-score strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "Bust! The round score was lost and the turn passed.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /SeatBravo.*turn begins in 3/,
    );
    expect(mockGetGame).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeDisabled();

    await advanceCooldown(1_000);
    expect(screen.getByRole("status")).toHaveTextContent(
      /SeatBravo.*turn begins in 2/,
    );
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();

    rerender(<App />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /SeatBravo.*turn begins in 2/,
    );
    expect(mockGetGame).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /Seat A/ }));
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /Seat B/ }));
      await Promise.resolve();
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      /SeatBravo.*turn begins in 2/,
    );
    expect(mockGetGame).toHaveBeenCalledTimes(3);

    await advanceCooldown(1_000);
    expect(screen.getByRole("status")).toHaveTextContent(
      /SeatBravo.*turn begins in 1/,
    );
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeDisabled();

    await advanceCooldown(1_000);
    expect(screen.getByRole("status")).toHaveTextContent(
      "SeatBravo, your turn!",
    );
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeEnabled();

    vi.useRealTimers();
    await actor.click(screen.getByRole("button", { name: "Roll dice" }));
    expect(mockRollGame).toHaveBeenNthCalledWith(2, "token-b", game.id, 1);
    expect(
      await screen.findByText("5", { selector: ".round-score strong" }),
    ).toBeInTheDocument();

    await actor.click(screen.getByRole("button", { name: "Hold score" }));
    expect(mockHoldGame).toHaveBeenCalledWith("token-b", game.id, 2);
    await waitFor(() => {
      expect(mockGetGame).toHaveBeenNthCalledWith(4, "token-a", game.id);
      expect(screen.getByRole("radio", { name: /Seat A/ })).toBeChecked();
    });
    expect(mockCreateGame).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh countdown for a later BUST version", async () => {
    const actor = userEvent.setup();
    const firstBust = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      lastRoll: [2, 5] as [number, number],
      lastEvent: "BUST" as const,
      allowedActions: ["restart"] as GameResponse["allowedActions"],
    };
    const secondBust = {
      ...firstBust,
      version: 2,
      activePlayerId: seatAUser.id,
    };
    mockCreateGame.mockResolvedValue(game);
    mockRollGame
      .mockResolvedValueOnce(firstBust)
      .mockResolvedValueOnce(secondBust);
    mockGetGame
      .mockResolvedValueOnce({
        ...firstBust,
        allowedActions: ["roll", "hold", "restart"],
      })
      .mockResolvedValueOnce({
        ...secondBust,
        allowedActions: ["roll", "hold", "restart"],
      });
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
    });
    await advanceCooldown(3_000);
    expect(screen.getByRole("status")).toHaveTextContent(
      "SeatBravo, your turn!",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
    });

    expect(mockRollGame).toHaveBeenNthCalledWith(2, "token-b", game.id, 1);
    expect(mockGetGame).toHaveBeenNthCalledWith(2, "token-a", game.id);
    expect(screen.getByRole("radio", { name: /Seat A/ })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      /SeatAlpha.*turn begins in 3/,
    );
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
  });

  it("keeps the same game locked when the next-player refetch fails", async () => {
    const actor = userEvent.setup();
    const bust = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      lastRoll: [2, 5] as [number, number],
      lastEvent: "BUST" as const,
      allowedActions: ["restart"] as GameResponse["allowedActions"],
    };
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockResolvedValue(bust);
    mockGetGame.mockRejectedValue(
      new GameApiError("The game could not be refreshed.", 503, "UNAVAILABLE"),
    );
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
    });
    await advanceCooldown(3_000);

    expect(
      screen.getByRole("heading", { name: "Game in progress" }),
    ).toBeInTheDocument();
    expect(screen.getByText("The game could not be refreshed."))
      .toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /waiting for a successful server refresh/i,
    );
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeDisabled();
  });

  it("waits for a pending next-player refetch after the timer finishes", async () => {
    const actor = userEvent.setup();
    const bust: GameResponse = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      lastEvent: "BUST",
      allowedActions: ["restart"],
    };
    const activePlayerView: GameResponse = {
      ...bust,
      allowedActions: ["roll", "hold", "restart"],
    };
    let resolveRefetch!: (value: GameResponse) => void;
    const pendingRefetch = new Promise<GameResponse>((resolve) => {
      resolveRefetch = resolve;
    });
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockResolvedValue(bust);
    mockGetGame.mockReturnValue(pendingRefetch);
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
    });
    await advanceCooldown(3_000);

    expect(screen.getByRole("status")).toHaveTextContent(
      /waiting for a successful server refresh/i,
    );
    expect(screen.getByRole("button", { name: "Updating..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeDisabled();

    await act(async () => {
      resolveRefetch(activePlayerView);
      await pendingRefetch;
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "SeatBravo, your turn!",
    );
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeEnabled();
  });

  it("keeps actions locked when the next player's session is unavailable", async () => {
    const actor = userEvent.setup();
    const bust: GameResponse = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      lastRoll: [2, 5],
      lastEvent: "BUST",
      allowedActions: ["restart"],
    };
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockResolvedValue(bust);
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(
      seatRegion("Seat B").getByRole("button", { name: "Log out Seat B" }),
    );
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
    });
    await advanceCooldown(3_000);

    expect(mockGetGame).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "SeatBravo must sign in before the turn can continue.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /waiting for a successful server refresh/i,
    );
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeDisabled();
  });

  it("does not start a BUST cooldown for Hold or Restart", async () => {
    const actor = userEvent.setup();
    const held: GameResponse = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      lastEvent: "HOLD",
      allowedActions: ["restart"],
    };
    const restarted: GameResponse = {
      ...held,
      version: 2,
      activePlayerId: seatAUser.id,
      lastEvent: "RESTART",
      allowedActions: ["restart"],
    };
    mockCreateGame.mockResolvedValue(game);
    mockHoldGame.mockResolvedValue(held);
    mockGetGame
      .mockResolvedValueOnce({
        ...held,
        allowedActions: ["roll", "hold", "restart"],
      })
      .mockResolvedValueOnce({
        ...restarted,
        allowedActions: ["roll", "hold", "restart"],
      });
    mockRestartGame.mockResolvedValue(restarted);
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    await actor.click(screen.getByRole("button", { name: "Hold score" }));

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: /Seat B/ })).toBeChecked();
    });
    expect(screen.queryByText(/turn begins in/i)).not.toBeInTheDocument();

    await actor.click(screen.getByRole("button", { name: "New game" }));
    expect(mockRestartGame).toHaveBeenCalledWith("token-b", game.id, 1);
    expect(screen.queryByText(/turn begins in/i)).not.toBeInTheDocument();
  });

  it("cleans the active countdown timer when App unmounts", async () => {
    const actor = userEvent.setup();
    const bust: GameResponse = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      lastEvent: "BUST",
      allowedActions: ["restart"],
    };
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockResolvedValue(bust);
    mockGetGame.mockResolvedValue({
      ...bust,
      allowedActions: ["roll", "hold", "restart"],
    });
    const { unmount } = render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
    });

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the timer when a different game replaces the BUST game", async () => {
    const actor = userEvent.setup();
    const bust: GameResponse = {
      ...game,
      version: 1,
      activePlayerId: seatBUser.id,
      lastEvent: "BUST",
      allowedActions: ["restart"],
    };
    const replacement: GameResponse = {
      ...bust,
      id: "a7ff5607-b06a-4448-b22e-bf0b93841a31",
      allowedActions: ["roll", "hold", "restart"],
    };
    mockCreateGame.mockResolvedValue(game);
    mockRollGame.mockResolvedValue(bust);
    mockGetGame.mockResolvedValue(replacement);
    render(<App />);

    await signInBoth(actor);
    await actor.click(screen.getByRole("button", { name: "Start game" }));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByText(/turn begins in/i)).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByRole("button", { name: "Roll dice" })).toBeEnabled();
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
