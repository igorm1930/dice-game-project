import { useEffect, useState } from 'react'
import { getHealth, type HealthResponse } from './api/health'
import './App.css'

type HealthState =
  | { status: 'loading' }
  | { status: 'success'; data: HealthResponse }
  | { status: 'error'; message: string }

function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((data) => {
        setHealth({ status: 'success', data })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        const message =
          error instanceof Error ? error.message : 'An unknown error occurred'

        setHealth({ status: 'error', message })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <main className="status-page">
      <section className="status-card" aria-live="polite">
        <p className="eyebrow">Dice game</p>
        <h1>API connection</h1>

        {health.status === 'loading' && (
          <p className="status loading">Checking the backend…</p>
        )}

        {health.status === 'success' && (
          <div className="status success">
            <span className="status-indicator" aria-hidden="true" />
            <div>
              <strong>Backend connected</strong>
              <p>
                {health.data.service} reported {health.data.status}.
              </p>
            </div>
          </div>
        )}

        {health.status === 'error' && (
          <div className="status error" role="alert">
            <strong>Backend unavailable</strong>
            <p>{health.message}</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
