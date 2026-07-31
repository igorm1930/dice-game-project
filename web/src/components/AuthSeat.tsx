import { useState, type FormEvent } from 'react'
import type { AuthCredentials } from '../api/auth'
import type { UserResponse } from '../api/users'

export type SeatId = 'a' | 'b'

interface AuthSeatProps {
  seatId: SeatId
  user: UserResponse | null
  busy: boolean
  error: string | null
  notice: string | null
  onRegister: (credentials: AuthCredentials) => Promise<void>
  onLogin: (credentials: AuthCredentials) => Promise<void>
  onLogout: () => void
}

export function AuthSeat({
  seatId,
  user,
  busy,
  error,
  notice,
  onRegister,
  onLogin,
  onLogout,
}: AuthSeatProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const seatName = `Seat ${seatId.toUpperCase()}`
  const headingId = `seat-${seatId}-heading`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const credentials = { username, password }

      if (mode === 'register') {
        await onRegister(credentials)
      } else {
        await onLogin(credentials)
      }
    } finally {
      setPassword('')
    }
  }

  return (
    <section
      className={'seat-card'}
      aria-label={seatName}
    >
      <div className={'seat-heading'}>
        <div>
          <p className={'step'}>{seatName}</p>
          <h2 id={headingId}>{user ? user.username : 'Authentication'}</h2>
        </div>
        <span className={`session-badge ${user ? 'authenticated' : ''}`}>
          {user ? 'Signed in' : 'Signed out'}
        </span>
      </div>

      {user ? (
        <div className={'session-details'}>
          <p>
            This seat is authenticated as <strong>{user.username}</strong>.
          </p>
          <button className={'secondary-button'} type={'button'} onClick={onLogout}>
            Log out {seatName}
          </button>
        </div>
      ) : (
        <>
          <div className={'auth-mode'} aria-label={`${seatName} authentication mode`}>
            <button
              type={'button'}
              aria-pressed={mode === 'login'}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              type={'button'}
              aria-pressed={mode === 'register'}
              onClick={() => setMode('register')}
            >
              Create account
            </button>
          </div>

          <form className={'auth-form'} onSubmit={handleSubmit}>
            <label htmlFor={`seat-${seatId}-username`}>Username</label>
            <input
              id={`seat-${seatId}-username`}
              name={'username'}
              type={'text'}
              minLength={3}
              maxLength={30}
              pattern={'[a-zA-Z0-9._-]{3,30}'}
              autoComplete={'username'}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />

            <label htmlFor={`seat-${seatId}-password`}>Password</label>
            <input
              id={`seat-${seatId}-password`}
              name={'password'}
              type={'password'}
              minLength={10}
              maxLength={128}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button className={'primary-button'} type={'submit'} disabled={busy}>
              {busy
                ? mode === 'register'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'register'
                  ? 'Create account'
                  : `Sign in to ${seatName}`}
            </button>
          </form>
        </>
      )}

      <div className={'seat-message'} aria-live={'polite'}>
        {error && (
          <p className={'form-error'} role={'alert'}>
            {error}
          </p>
        )}
        {!error && notice && <p className={'form-notice'}>{notice}</p>}
      </div>
    </section>
  )
}
