import { useState, type FormEvent } from 'react'
import type { GameResponse } from '../api/games'

const dieFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'] as const

interface GameBoardProps {
  game: GameResponse | null
  playerNames: Readonly<Record<string, string>>
  creatorName: string | null
  opponentName: string | null
  actingUsername: string | null
  busy: boolean
  error: string | null
  onCreate: (winningScore: number) => void
  onRoll: () => void
  onHold: () => void
  onRestart: () => void
}

interface DieProps {
  index: number
  value: number | null
}

function Die({ index, value }: DieProps) {
  return (
    <span
      className={'die'}
      aria-label={
        value === null ? `Die ${index}: not rolled` : `Die ${index}: ${value}`
      }
    >
      <span aria-hidden={true}>{value === null ? '–' : dieFaces[value]}</span>
    </span>
  )
}

export function GameBoard({
  game,
  playerNames,
  creatorName,
  opponentName,
  actingUsername,
  busy,
  error,
  onCreate,
  onRoll,
  onHold,
  onRestart,
}: GameBoardProps) {
  const [winningScore, setWinningScore] = useState('100')

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedScore = Number(winningScore)

    if (!Number.isSafeInteger(parsedScore) || parsedScore < 1) {
      return
    }

    onCreate(parsedScore)
  }

  if (!game) {
    return (
      <section
        className={'game-panel setup-panel'}
        aria-labelledby={'game-heading'}
      >
        <div>
          <p className={'step'}>Game setup</p>
          <h2 id={'game-heading'}>Start a new game</h2>
          <p className={'panel-copy'}>
            Sign in both seats and choose the acting seat. That authenticated
            player becomes Player 1 and takes the first turn.
          </p>
        </div>

        <form className={'game-setup-form'} onSubmit={handleCreate}>
          <div className={'matchup'} aria-live={'polite'}>
            <span>{creatorName ?? 'Choose an authenticated creator'}</span>
            <strong aria-hidden={true}>vs</strong>
            <span>{opponentName ?? 'Sign in the other seat'}</span>
          </div>

          <label htmlFor={'winning-score'}>Winning score</label>
          <input
            id={'winning-score'}
            name={'winningScore'}
            type={'number'}
            min={1}
            max={Number.MAX_SAFE_INTEGER}
            step={1}
            value={winningScore}
            onChange={(event) => setWinningScore(event.target.value)}
            required
          />

          <button
            className={'primary-button'}
            type={'submit'}
            disabled={!creatorName || !opponentName || busy}
          >
            {busy ? 'Starting game...' : 'Start game'}
          </button>
        </form>

        {error && (
          <p className={'form-error game-error'} role={'alert'}>
            {error}
          </p>
        )}
      </section>
    )
  }

  const winnerName = game.winnerId
    ? (playerNames[game.winnerId] ?? 'Unknown player')
    : null

  return (
    <section className={'game-panel'} aria-labelledby={'game-heading'}>
      <div className={'game-heading'}>
        <div>
          <p className={'step'}>Live game</p>
          <h2 id={'game-heading'}>
            {game.status === 'won' ? `${winnerName} wins` : 'Game in progress'}
          </h2>
          <p className={'panel-copy'}>
            Acting as{' '}
            <strong>{actingUsername ?? 'no authenticated seat'}</strong>.
            Controls follow the permissions returned for that token.
          </p>
        </div>
        <span className={`game-status ${game.status}`}>
          {game.status === 'won' ? 'Finished' : `First to ${game.winningScore}`}
        </span>
      </div>

      {game.status === 'won' && (
        <p className={'winner-banner'} role={'status'}>
          {winnerName} reached the target. Start a new game to play again.
        </p>
      )}

      <div className={'scoreboard'}>
        {game.players.map((player, index) => {
          const isCurrent = player.id === game.activePlayerId

          return (
            <article
              className={`player-score ${isCurrent ? 'current' : ''}`}
              key={player.id}
              aria-label={`Player ${index + 1}: ${playerNames[player.id] ?? 'Unknown player'}`}
            >
              <div>
                <span className={'player-number'}>Player {index + 1}</span>
                <h3>{playerNames[player.id] ?? 'Unknown player'}</h3>
              </div>
              <strong className={'global-score'}>{player.globalScore}</strong>
              <span className={'turn-marker'}>
                {isCurrent ? 'Current turn' : 'Waiting'}
              </span>
            </article>
          )
        })}
      </div>

      <div className={'turn-table'}>
        <div className={'round-score'}>
          <span>Round score</span>
          <strong>{game.roundScore}</strong>
        </div>

        <div className={'dice'} aria-label={'Last roll'}>
          <Die index={1} value={game.lastRoll?.[0] ?? null} />
          <Die index={2} value={game.lastRoll?.[1] ?? null} />
        </div>

        <div className={'game-actions'}>
          <button
            className={'primary-button roll-button'}
            type={'button'}
            disabled={
              busy || !actingUsername || !game.allowedActions.includes('roll')
            }
            onClick={onRoll}
          >
            {busy ? 'Updating...' : 'Roll dice'}
          </button>
          <button
            className={'secondary-button'}
            type={'button'}
            disabled={
              busy || !actingUsername || !game.allowedActions.includes('hold')
            }
            onClick={onHold}
          >
            Hold score
          </button>
          <button
            className={'secondary-button new-game-button'}
            type={'button'}
            disabled={
              busy ||
              !actingUsername ||
              !game.allowedActions.includes('restart')
            }
            onClick={onRestart}
          >
            New game
          </button>
        </div>
      </div>

      <div className={'game-message'} aria-live={'polite'}>
        {busy && <p>Waiting for the server...</p>}
        {error && (
          <p className={'form-error game-error'} role={'alert'}>
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
