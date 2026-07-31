import { useEffect, useState, type FormEvent } from 'react'
import { getHealth, type HealthResponse } from './api/health'
import { createUser, listUsers, type UserResponse } from './api/users'
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
  const [username, setUsername] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState('')

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    setFormError('')

    try {
      const user = await createUser(username)
      setUsers((current) => ({
        status: 'success',
        data: current.status === 'success' ? [...current.data, user] : [user],
      }))
      setUsername('')
    } catch (error: unknown) {
      setFormError(errorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className={'user-page'}>
      <header className={'page-header'}>
        <div>
          <p className={'eyebrow'}>Dice game</p>
          <h1>Persistent players</h1>
          <p className={'intro'}>
            Create the players who will join a future game. Authentication is
            intentionally coming later.
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
        <section className={'panel'} aria-labelledby={'create-user-heading'}>
          <p className={'step'}>Step 01</p>
          <h2 id={'create-user-heading'}>Create a player</h2>
          <p className={'panel-copy'}>
            Usernames use 3-30 letters, numbers, dots, underscores, or hyphens.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor={'username'}>Username</label>
            <input
              id={'username'}
              name={'username'}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={30}
              pattern={'[a-zA-Z0-9._\\-]{3,30}'}
              autoComplete={'off'}
              required
              disabled={isCreating}
            />
            <button
              type={'submit'}
              disabled={isCreating || !username.trim()}
            >
              {isCreating ? 'Creating...' : 'Create player'}
            </button>
          </form>

          {formError && (
            <p className={'form-error'} role={'alert'}>
              {formError}
            </p>
          )}
        </section>

        <section className={'panel'} aria-labelledby={'saved-users-heading'}>
          <p className={'step'}>Step 02</p>
          <h2 id={'saved-users-heading'}>Saved players</h2>
          <p className={'panel-copy'}>
            This list is loaded from MongoDB and survives an API restart.
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
