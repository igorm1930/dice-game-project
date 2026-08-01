import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import type { GameResponse } from "../api/games";
import { GameBoard } from "./GameBoard";

const game: GameResponse = {
  id: "d43acc2f-a715-49a1-bf4f-74b16592e553",
  version: 0,
  players: [
    { id: "507f1f77bcf86cd799439011", globalScore: 12 },
    { id: "507f1f77bcf86cd799439012", globalScore: 7 },
  ],
  activePlayerId: "507f1f77bcf86cd799439011",
  roundScore: 5,
  winningScore: 25,
  lastRoll: [2, 3],
  status: "active",
  winnerId: null,
  allowedActions: ["roll", "hold", "restart"],
};

const playerNames = {
  "507f1f77bcf86cd799439011": "SeatAlpha",
  "507f1f77bcf86cd799439012": "SeatBravo",
};

function renderBoard(
  overrides: Partial<ComponentProps<typeof GameBoard>> = {},
) {
  const props: ComponentProps<typeof GameBoard> = {
    game,
    playerNames,
    playerWins: {
      "507f1f77bcf86cd799439011": 2,
      "507f1f77bcf86cd799439012": 1,
    },
    creatorName: "SeatAlpha",
    opponentName: "SeatBravo",
    actingUsername: "SeatAlpha",
    busy: false,
    error: null,
    onCreate: vi.fn(),
    onRoll: vi.fn(),
    onHold: vi.fn(),
    onRestart: vi.fn(),
    ...overrides,
  };

  render(<GameBoard {...props} />);
  return props;
}

describe("GameBoard", () => {
  it("creates a game with the entered winning score", async () => {
    const actor = userEvent.setup();
    const onCreate = vi.fn();
    renderBoard({ game: null, onCreate });

    const score = screen.getByLabelText("Winning score");
    await actor.clear(score);
    await actor.type(score, "30");
    await actor.click(screen.getByRole("button", { name: "Start game" }));

    expect(onCreate).toHaveBeenCalledWith(30);
  });

  it("renders server-provided players, scores, turn, round, and dice", () => {
    renderBoard();

    const playerOne = screen.getByRole("article", {
      name: "Player 1: SeatAlpha",
    });
    const playerTwo = screen.getByRole("article", {
      name: "Player 2: SeatBravo",
    });

    expect(within(playerOne).getByText("12")).toBeInTheDocument();
    expect(within(playerOne).getByText("Current turn")).toBeInTheDocument();
    expect(within(playerOne).getByText("Lifetime wins: 2")).toBeInTheDocument();
    expect(within(playerTwo).getByText("7")).toBeInTheDocument();
    expect(within(playerTwo).getByText("Waiting")).toBeInTheDocument();
    expect(
      screen.getByText("5", { selector: ".round-score strong" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Die 1: 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Die 2: 3")).toBeInTheDocument();
  });

  it("enables controls only from server-provided allowed actions", () => {
    renderBoard({
      game: {
        ...game,
        allowedActions: ["restart"],
      },
      actingUsername: "SeatBravo",
    });

    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeEnabled();
  });

  it("disables every action without an authenticated acting seat", () => {
    renderBoard({ actingUsername: null });

    expect(screen.getByRole("button", { name: "Roll dice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hold score" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New game" })).toBeDisabled();
  });

  it("calls the approved action callbacks without calculating state", async () => {
    const actor = userEvent.setup();
    const onRoll = vi.fn();
    const onHold = vi.fn();
    const onRestart = vi.fn();
    renderBoard({ onRoll, onHold, onRestart });

    await actor.click(screen.getByRole("button", { name: "Roll dice" }));
    await actor.click(screen.getByRole("button", { name: "Hold score" }));
    await actor.click(screen.getByRole("button", { name: "New game" }));

    expect(onRoll).toHaveBeenCalledOnce();
    expect(onHold).toHaveBeenCalledOnce();
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("renders winner state supplied by the server", () => {
    renderBoard({
      game: {
        ...game,
        status: "won",
        winnerId: game.players[0].id,
        allowedActions: ["restart"],
      },
    });

    expect(
      screen.getByRole("heading", { name: "SeatAlpha wins" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/SeatAlpha reached the target/),
    ).toBeInTheDocument();
  });

  it("announces server-provided double-six feedback", () => {
    renderBoard({
      game: {
        ...game,
        lastRoll: [6, 6],
        roundScore: 0,
        activePlayerId: game.players[1].id,
      },
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Double six! The round score was lost and the turn passed.",
    );
    expect(screen.getByLabelText("Last roll")).toHaveClass("double-six");
  });
});
