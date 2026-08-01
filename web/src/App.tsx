import { useEffect, useState } from "react";
import {
  AuthApiError,
  getCurrentUser,
  login,
  register,
  type AuthCredentials,
} from "./api/auth";
import {
  createGame,
  GameApiError,
  getGame,
  holdGame,
  restartGame,
  rollGame,
  type GameResponse,
} from "./api/games";
import { getHealth, type HealthResponse } from "./api/health";
import { listUsers, type UserResponse } from "./api/users";
import { AuthSeat, type SeatId } from "./components/AuthSeat";
import { GameBoard } from "./components/GameBoard";
import "./App.css";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

type UsersState =
  | { status: "loading" }
  | { status: "success"; data: UserResponse[] }
  | { status: "error"; message: string };

interface AuthSession {
  user: UserResponse;
  accessToken: string;
}

interface SeatState {
  session: AuthSession | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
}

type IdentityState =
  | { status: "idle" | "loading" }
  | { status: "success"; seatId: SeatId; user: UserResponse }
  | { status: "error"; message: string };

interface GameState {
  data: GameResponse | null;
  playerNames: Record<string, string>;
  busy: boolean;
  error: string | null;
}

function emptySeat(): SeatState {
  return { session: null, busy: false, error: null, notice: null };
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "";
  }

  return error instanceof Error ? error.message : "An unknown error occurred";
}

function otherSeat(seatId: SeatId): SeatId {
  return seatId === "a" ? "b" : "a";
}

function seatForPlayer(
  seats: Readonly<Record<SeatId, SeatState>>,
  playerId: string,
): SeatId | null {
  return (
    (["a", "b"] as const).find(
      (seatId) => seats[seatId].session?.user.id === playerId,
    ) ?? null
  );
}

function App() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [users, setUsers] = useState<UsersState>({ status: "loading" });
  const [seats, setSeats] = useState<Record<SeatId, SeatState>>({
    a: emptySeat(),
    b: emptySeat(),
  });
  const [activeSeat, setActiveSeat] = useState<SeatId | null>(null);
  const [identity, setIdentity] = useState<IdentityState>({ status: "idle" });
  const [game, setGame] = useState<GameState>({
    data: null,
    playerNames: {},
    busy: false,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    getHealth(controller.signal)
      .then((data) => setHealth({ status: "success", data }))
      .catch((error: unknown) => {
        const message = errorMessage(error);
        if (message) setHealth({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    listUsers(controller.signal)
      .then((data) => setUsers({ status: "success", data }))
      .catch((error: unknown) => {
        const message = errorMessage(error);
        if (message) setUsers({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  function updateSeat(seatId: SeatId, update: Partial<SeatState>) {
    setSeats((current) => ({
      ...current,
      [seatId]: { ...current[seatId], ...update },
    }));
  }

  async function refreshUsers() {
    try {
      const latestUsers = await listUsers();
      setUsers({ status: "success", data: latestUsers });
    } catch (error) {
      setUsers({ status: "error", message: errorMessage(error) });
    }
  }

  function expireSeat(seatId: SeatId) {
    const fallbackSeat = otherSeat(seatId);
    const fallbackSession = seats[fallbackSeat].session;
    const shouldChangeActiveSeat = activeSeat === seatId;

    updateSeat(seatId, {
      session: null,
      error: "This session expired or is invalid. Sign in again.",
      notice: null,
    });
    setActiveSeat((current) =>
      current === seatId
        ? seats[fallbackSeat].session
          ? fallbackSeat
          : null
        : current,
    );

    if (shouldChangeActiveSeat && fallbackSession && game.data) {
      void refreshGameForSeat(fallbackSeat, fallbackSession, game.data.id);
    }
  }

  function handleGameError(error: unknown, seatId: SeatId) {
    if (error instanceof GameApiError && error.status === 401) {
      expireSeat(seatId);
    }

    if (
      error instanceof GameApiError &&
      error.status === 404 &&
      error.code === "GAME_NOT_FOUND"
    ) {
      setGame((current) => ({
        ...current,
        data: null,
        busy: false,
        error: "This game is no longer available. Start a new game.",
      }));
      return;
    }

    setGame((current) => ({
      ...current,
      busy: false,
      error: errorMessage(error),
    }));
  }

  async function refreshGameForSeat(
    seatId: SeatId,
    session: AuthSession,
    gameId: string,
  ) {
    setGame((current) => ({ ...current, busy: true, error: null }));

    try {
      const data = await getGame(session.accessToken, gameId);
      setGame((current) => ({
        ...current,
        data,
        busy: false,
        error: null,
      }));

      if (data.status === "won") {
        void refreshUsers();
      }
    } catch (error) {
      handleGameError(error, seatId);
    }
  }

  async function handleActiveSeatChange(seatId: SeatId) {
    const session = seats[seatId].session;
    if (!session) return;

    setActiveSeat(seatId);
    setIdentity({ status: "idle" });

    if (game.data) {
      await refreshGameForSeat(seatId, session, game.data.id);
    }
  }

  async function handleCreateGame(winningScore: number) {
    if (!activeSeat) return;

    const creator = seats[activeSeat].session;
    const opponent = seats[otherSeat(activeSeat)].session;
    if (!creator || !opponent) return;

    setGame((current) => ({ ...current, busy: true, error: null }));

    try {
      const data = await createGame(creator.accessToken, {
        opponentId: opponent.user.id,
        winningScore,
      });
      setGame({
        data,
        playerNames: {
          [creator.user.id]: creator.user.username,
          [opponent.user.id]: opponent.user.username,
        },
        busy: false,
        error: null,
      });
    } catch (error) {
      handleGameError(error, activeSeat);
    }
  }

  async function handleGameAction(
    request: (
      accessToken: string,
      gameId: string,
      expectedVersion: number,
    ) => Promise<GameResponse>,
  ) {
    if (!activeSeat || !game.data || game.busy) return;

    const session = seats[activeSeat].session;
    if (!session) return;

    setGame((current) => ({ ...current, busy: true, error: null }));

    try {
      const data = await request(
        session.accessToken,
        game.data.id,
        game.data.version,
      );
      setGame((current) => ({
        ...current,
        data,
        busy: false,
        error: null,
      }));

      const nextSeat = seatForPlayer(seats, data.activePlayerId);
      if (data.status === "active" && nextSeat && nextSeat !== activeSeat) {
        const nextSession = seats[nextSeat].session;

        if (nextSession) {
          setActiveSeat(nextSeat);
          setIdentity({ status: "idle" });
          await refreshGameForSeat(nextSeat, nextSession, data.id);
        }
      }

      if (data.status === "won") {
        void refreshUsers();
      }
    } catch (error) {
      if (
        error instanceof GameApiError &&
        error.status === 409 &&
        error.code === "GAME_STATE_CONFLICT"
      ) {
        try {
          const data = await getGame(session.accessToken, game.data.id);
          setGame((current) => ({
            ...current,
            data,
            busy: false,
            error: "Game changed in another request. Latest state loaded.",
          }));
          if (data.status === "won") {
            void refreshUsers();
          }
          return;
        } catch (refreshError) {
          handleGameError(refreshError, activeSeat);
          return;
        }
      }

      handleGameError(error, activeSeat);
    }
  }

  async function handleRegister(seatId: SeatId, credentials: AuthCredentials) {
    updateSeat(seatId, { busy: true, error: null, notice: null });

    try {
      const user = await register(credentials);
      updateSeat(seatId, {
        busy: false,
        notice: `${user.username} was registered. Sign in to start this seat's session.`,
      });
    } catch (error) {
      updateSeat(seatId, { busy: false, error: errorMessage(error) });
    }
  }

  async function handleLogin(seatId: SeatId, credentials: AuthCredentials) {
    const shouldActivateSeat = activeSeat === null;
    updateSeat(seatId, { busy: true, error: null, notice: null });

    try {
      const token = await login(credentials);
      const user = await getCurrentUser(token.accessToken);

      updateSeat(seatId, {
        session: { user, accessToken: token.accessToken },
        busy: false,
        notice: `${user.username} is signed in to Seat ${seatId.toUpperCase()}.`,
      });
      setActiveSeat((current) => current ?? seatId);
      setIdentity({ status: "idle" });

      if (shouldActivateSeat && game.data) {
        await refreshGameForSeat(
          seatId,
          { user, accessToken: token.accessToken },
          game.data.id,
        );
      }
    } catch (error) {
      updateSeat(seatId, {
        session: null,
        busy: false,
        error: errorMessage(error),
      });
    }
  }

  function handleLogout(seatId: SeatId) {
    const fallbackSeat = otherSeat(seatId);
    const shouldChangeActiveSeat = activeSeat === seatId;
    const fallbackSession = seats[fallbackSeat].session;

    updateSeat(seatId, {
      session: null,
      busy: false,
      error: null,
      notice: `Seat ${seatId.toUpperCase()} was logged out.`,
    });
    setActiveSeat((current) =>
      current === seatId
        ? seats[fallbackSeat].session
          ? fallbackSeat
          : null
        : current,
    );
    setIdentity({ status: "idle" });

    if (shouldChangeActiveSeat && fallbackSession && game.data) {
      void refreshGameForSeat(fallbackSeat, fallbackSession, game.data.id);
    }
  }

  async function verifyActiveIdentity() {
    if (!activeSeat) return;

    const activeSession = seats[activeSeat].session;
    if (!activeSession) return;

    setIdentity({ status: "loading" });

    try {
      const user = await getCurrentUser(activeSession.accessToken);
      setIdentity({ status: "success", seatId: activeSeat, user });
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        expireSeat(activeSeat);
      }

      setIdentity({ status: "error", message: errorMessage(error) });
    }
  }

  const creatorSession = activeSeat ? seats[activeSeat].session : null;
  const opponentSession = activeSeat
    ? seats[otherSeat(activeSeat)].session
    : null;
  const playerWins =
    users.status === "success"
      ? Object.fromEntries(users.data.map((user) => [user.id, user.wins]))
      : {};

  return (
    <main className={"user-page"}>
      <header className={"page-header"}>
        <div>
          <p className={"eyebrow"}>Dice game</p>
          <h1>Two players, one game</h1>
          <p className={"intro"}>
            Sign in two players independently, choose the acting seat, and play
            entirely through server-owned game state and permissions.
          </p>
        </div>

        <div className={`api-status ${health.status}`} aria-live={"polite"}>
          {health.status === "loading" && "Checking API..."}
          {health.status === "success" && `${health.data.service} connected`}
          {health.status === "error" && `API unavailable: ${health.message}`}
        </div>
      </header>

      <div className={"seat-grid"}>
        {(["a", "b"] as const).map((seatId) => (
          <AuthSeat
            key={seatId}
            seatId={seatId}
            user={seats[seatId].session?.user ?? null}
            busy={seats[seatId].busy}
            error={seats[seatId].error}
            notice={seats[seatId].notice}
            onRegister={(credentials) => handleRegister(seatId, credentials)}
            onLogin={(credentials) => handleLogin(seatId, credentials)}
            onLogout={() => handleLogout(seatId)}
          />
        ))}
      </div>

      <section className={"acting-panel"} aria-labelledby={"acting-heading"}>
        <div>
          <p className={"step"}>Protected request identity</p>
          <h2 id={"acting-heading"}>Acting as</h2>
          <p className={"panel-copy"}>
            The selected seat's bearer token is sent to the protected
            current-user endpoint. No user ID is sent by the frontend.
          </p>
        </div>

        <fieldset className={"seat-selector"}>
          <legend>Choose the active authenticated seat</legend>
          {(["a", "b"] as const).map((seatId) => (
            <label
              key={seatId}
              className={activeSeat === seatId ? "selected" : ""}
            >
              <input
                type={"radio"}
                name={"active-seat"}
                value={seatId}
                checked={activeSeat === seatId}
                disabled={!seats[seatId].session || game.busy}
                onChange={() => void handleActiveSeatChange(seatId)}
              />
              <span>
                Seat {seatId.toUpperCase()}
                <small>
                  {seats[seatId].session?.user.username ?? "Sign in required"}
                </small>
              </span>
            </label>
          ))}
        </fieldset>

        <button
          className={"primary-button verify-button"}
          type={"button"}
          disabled={!activeSeat || identity.status === "loading"}
          onClick={verifyActiveIdentity}
        >
          {identity.status === "loading"
            ? "Verifying identity..."
            : "Verify acting identity"}
        </button>

        <div className={"identity-result"} aria-live={"polite"}>
          {identity.status === "success" && (
            <p className={"form-notice"}>
              Backend verified Seat {identity.seatId.toUpperCase()} as{" "}
              <strong>{identity.user.username}</strong>.
            </p>
          )}
          {identity.status === "error" && (
            <p className={"form-error"} role={"alert"}>
              {identity.message}
            </p>
          )}
        </div>
      </section>

      <GameBoard
        game={game.data}
        playerNames={game.playerNames}
        playerWins={playerWins}
        creatorName={creatorSession?.user.username ?? null}
        opponentName={opponentSession?.user.username ?? null}
        actingUsername={creatorSession?.user.username ?? null}
        busy={game.busy}
        error={game.error}
        onCreate={(winningScore) => void handleCreateGame(winningScore)}
        onRoll={() => void handleGameAction(rollGame)}
        onHold={() => void handleGameAction(holdGame)}
        onRestart={() => void handleGameAction(restartGame)}
      />

      <section
        className={"panel players-panel"}
        aria-labelledby={"saved-users-heading"}
      >
        <p className={"step"}>Players</p>
        <h2 id={"saved-users-heading"}>Saved players</h2>
        <p className={"panel-copy"}>
          This public list may include legacy players without passwords. Only
          accounts registered through authentication can sign in.
        </p>

        <div className={"users-region"} aria-live={"polite"}>
          {users.status === "loading" && <p>Loading players...</p>}
          {users.status === "error" && (
            <p className={"form-error"} role={"alert"}>
              {users.message}
            </p>
          )}
          {users.status === "success" && users.data.length === 0 && (
            <p className={"empty-state"}>No players saved yet.</p>
          )}
          {users.status === "success" && users.data.length > 0 && (
            <ul className={"user-list"}>
              {users.data.map((user) => (
                <li key={user.id}>
                  <span className={"avatar"} aria-hidden={true}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <strong>{user.username}</strong>
                    <small className={"saved-player-wins"}>
                      Wins: {user.wins}
                    </small>
                    <small>
                      Saved {new Date(user.createdAt).toLocaleString()}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
