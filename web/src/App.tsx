import { useEffect, useState } from 'react'
import {
  AuthApiError,
  getCurrentUser,
  login,
  register,
  type AuthCredentials,
} from './api/auth'
import { getHealth, type HealthResponse } from './api/health'
import { listUsers, type UserResponse } from './api/users'
import { AuthSeat, type SeatId } from './components/AuthSeat'
import './App.css'

type HealthState =
  | { status: 'loading' }
  | { status: 'success'; data: HealthResponse }
  | { status: 'error'; message: string }

type UsersState =
  | { status: 'loading' }
  | { status: 'success'; data: UserResponse[] }
  | { status: 'error'; message: string }

interface AuthSession {
  user: UserResponse
  accessToken: string
}

interface SeatState {
  session: AuthSession | null
  busy: boolean
  error: string | null
  notice: string | null
}

type IdentityState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; seatId: SeatId; user: UserResponse }
  | { status: 'error'; message: string }

function emptySeat(): SeatState {
  return { session: null, busy: false, error: null, notice: null }
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return ''
  }

  return error instanceof Error ? error.message : 'An unknown error occurred'
}

function otherSeat(seatId: SeatId): SeatId {
  return seatId === 'a' ? 'b' : 'a'
}

function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })
  const [users, setUsers] = useState<UsersState>({ status: 'loading' })
  const [seats, setSeats] = useState<Record<SeatId, SeatState>>({
    a: emptySeat(),
    b: emptySeat(),
  })
  const [activeSeat, setActiveSeat] = useState<SeatId | null>(null)
  const [identity, setIdentity] = useState<IdentityState>({ status: 'idle' })

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((data) => setHealth({ status: 'success', data }))
      .catch((error: unknown) => {
        const message = errorMessage(error)
        if (message) setHealth({ status: 'error', message })
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    listUsers(controller.signal)
      .then((data) => setUsers({ status: 'success', data }))
      .catch((error: unknown) => {
        const message = errorMessage(error)
        if (message) setUsers({ status: 'error', message })
      })

    return () => controller.abort()
  }, [])

  function updateSeat(seatId: SeatId, update: Partial<SeatState>) {
    setSeats((current) => ({
      ...current,
      [seatId]: { ...current[seatId], ...update },
    }))
  }

  async function handleRegister(
    seatId: SeatId,
    credentials: AuthCredentials,
  ) {
    updateSeat(seatId, { busy: true, error: null, notice: null })

    try {
      const user = await register(credentials)
      updateSeat(seatId, {
        busy: false,
        notice: `${user.username} was registered. Sign in to start this seat's session.`,
      })
    } catch (error) {
      updateSeat(seatId, { busy: false, error: errorMessage(error) })
    }
  }

  async function handleLogin(
    seatId: SeatId,
    credentials: AuthCredentials,
  ) {
    updateSeat(seatId, { busy: true, error: null, notice: null })

    try {
      const token = await login(credentials)
      const user = await getCurrentUser(token.accessToken)

      updateSeat(seatId, {
        session: { user, accessToken: token.accessToken },
        busy: false,
        notice: `${user.username} is signed in to Seat ${seatId.toUpperCase()}.`,
      })
      setActiveSeat((current) => current ?? seatId)
      setIdentity({ status: 'idle' })
    } catch (error) {
      updateSeat(seatId, {
        session: null,
        busy: false,
        error: errorMessage(error),
      })
    }
  }

  function handleLogout(seatId: SeatId) {
    const fallbackSeat = otherSeat(seatId)

    updateSeat(seatId, {
      session: null,
      busy: false,
      error: null,
      notice: `Seat ${seatId.toUpperCase()} was logged out.`,
    })
    setActiveSeat((current) =>
      current === seatId
        ? seats[fallbackSeat].session
          ? fallbackSeat
          : null
        : current,
    )
    setIdentity({ status: 'idle' })
  }

  async function verifyActiveIdentity() {
    if (!activeSeat) return

    const activeSession = seats[activeSeat].session
    if (!activeSession) return

    setIdentity({ status: 'loading' })

    try {
      const user = await getCurrentUser(activeSession.accessToken)
      setIdentity({ status: 'success', seatId: activeSeat, user })
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        const expiredSeat = activeSeat
        const fallbackSeat = otherSeat(expiredSeat)

        updateSeat(expiredSeat, {
          session: null,
          error: 'This session expired or is invalid. Sign in again.',
          notice: null,
        })
        setActiveSeat(seats[fallbackSeat].session ? fallbackSeat : null)
      }

      setIdentity({ status: 'error', message: errorMessage(error) })
    }
  }

  return (
    <main className={'user-page'}>
      <header className={'page-header'}>
        <div>
          <p className={'eyebrow'}>Dice game</p>
          <h1>Two player sessions</h1>
          <p className={'intro'}>
            Sign in two players independently, then choose which authenticated
            seat is acting. Sessions stay only in this browser tab's memory.
          </p>
        </div>

        <div className={`api-status ${health.status}`} aria-live={'polite'}>
          {health.status === 'loading' && 'Checking API...'}
          {health.status === 'success' && `${health.data.service} connected`}
          {health.status === 'error' && `API unavailable: ${health.message}`}
        </div>
      </header>

      <div className={'seat-grid'}>
        {(['a', 'b'] as const).map((seatId) => (
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

      <section className={'acting-panel'} aria-labelledby={'acting-heading'}>
        <div>
          <p className={'step'}>Protected request identity</p>
          <h2 id={'acting-heading'}>Acting as</h2>
          <p className={'panel-copy'}>
            The selected seat's bearer token is sent to the protected
            current-user endpoint. No user ID is sent by the frontend.
          </p>
        </div>

        <fieldset className={'seat-selector'}>
          <legend>Choose the active authenticated seat</legend>
          {(['a', 'b'] as const).map((seatId) => (
            <label
              key={seatId}
              className={activeSeat === seatId ? 'selected' : ''}
            >
              <input
                type={'radio'}
                name={'active-seat'}
                value={seatId}
                checked={activeSeat === seatId}
                disabled={!seats[seatId].session}
                onChange={() => {
                  setActiveSeat(seatId)
                  setIdentity({ status: 'idle' })
                }}
              />
              <span>
                Seat {seatId.toUpperCase()}
                <small>
                  {seats[seatId].session?.user.username ?? 'Sign in required'}
                </small>
              </span>
            </label>
          ))}
        </fieldset>

        <button
          className={'primary-button verify-button'}
          type={'button'}
          disabled={!activeSeat || identity.status === 'loading'}
          onClick={verifyActiveIdentity}
        >
          {identity.status === 'loading'
            ? 'Verifying identity...'
            : 'Verify acting identity'}
        </button>

        <div className={'identity-result'} aria-live={'polite'}>
          {identity.status === 'success' && (
            <p className={'form-notice'}>
              Backend verified Seat {identity.seatId.toUpperCase()} as{' '}
              <strong>{identity.user.username}</strong>.
            </p>
          )}
          {identity.status === 'error' && (
            <p className={'form-error'} role={'alert'}>
              {identity.message}
            </p>
          )}
        </div>
      </section>

      <section
        className={'panel players-panel'}
        aria-labelledby={'saved-users-heading'}
      >
        <p className={'step'}>Players</p>
        <h2 id={'saved-users-heading'}>Saved players</h2>
        <p className={'panel-copy'}>
          This public list may include legacy players without passwords. Only
          accounts registered through authentication can sign in.
        </p>

        <div className={'users-region'} aria-live={'polite'}>
          {users.status === 'loading' && <p>Loading players...</p>}
          {users.status === 'error' && (
            <p className={'form-error'} role={'alert'}>
              {users.message}
            </p>
          )}
          {users.status === 'success' && users.data.length === 0 && (
            <p className={'empty-state'}>No players saved yet.</p>
          )}
          {users.status === 'success' && users.data.length > 0 && (
            <ul className={'user-list'}>
              {users.data.map((user) => (
                <li key={user.id}>
                  <span className={'avatar'} aria-hidden={true}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <strong>{user.username}</strong>
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
  )
}

export default App
