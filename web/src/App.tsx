import { useEffect, useState } from 'react'
import { getHealth, type HealthResponse } from './api/health'
import { listUsers, type UserResponse } from './api/users'
import './App.css'

type HealthState =
  | { status: 'loading' }
  | { status: 'success'; data: HealthResponse }
  | { status: 'error'; message: string }

type UsersState =
  | { status: 'loading' }
  | { status: 'success'; data: UserResponse[] }
  | { status: 'error'; message: string }

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return ''
  }

  return error instanceof Error ? error.message : 'An unknown error occurred'
}

function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })
  const [users, setUsers] = useState<UsersState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((data) => setHealth({ status: 'success', data }))
      .catch((error: unknown) => {
        const message = errorMessage(error)

        if (message) {
          setHealth({ status: 'error', message })
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    listUsers(controller.signal)
      .then((data) => setUsers({ status: 'success', data }))
      .catch((error: unknown) => {
        const message = errorMessage(error)

        if (message) {
          setUsers({ status: 'error', message })
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <main className={'user-page'}>
      <header className={'page-header'}>
        <div>
          <p className={'eyebrow'}>Dice game</p>
          <h1>Registered players</h1>
          <p className={'intro'}>
            Authentication is now enforced by the API. Two-player sign-in will
            be added in the next phase.
          </p>
        </div>

        <div
          className={`api-status ${health.status}`}
          aria-live={'polite'}
        >
          {health.status === 'loading' && 'Checking API...'}
          {health.status === 'success' && `${health.data.service} connected`}
          {health.status === 'error' && `API unavailable: ${health.message}`}
        </div>
      </header>

      <div className={'content-grid'}>
        <section className={'panel'} aria-labelledby={'saved-users-heading'}>
          <p className={'step'}>Players</p>
          <h2 id={'saved-users-heading'}>Saved players</h2>
          <p className={'panel-copy'}>
            This public list is loaded from MongoDB. Registration and login are
            handled securely by the backend API.
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
      </div>
    </main>
  )
}

export default App
