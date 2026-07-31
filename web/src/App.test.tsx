import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import {
  AuthApiError,
  getCurrentUser,
  login,
  register,
} from './api/auth'
import { getHealth } from './api/health'
import { listUsers, type UserResponse } from './api/users'

vi.mock('./api/health', () => ({ getHealth: vi.fn() }))
vi.mock('./api/users', () => ({ listUsers: vi.fn() }))
vi.mock('./api/auth', () => {
  class MockAuthApiError extends Error {
    readonly status: number
    readonly code?: string

    constructor(message: string, status: number, code?: string) {
      super(message)
      this.status = status
      this.code = code
    }
  }

  return {
    AuthApiError: MockAuthApiError,
    register: vi.fn(),
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  }
})

const mockGetHealth = vi.mocked(getHealth)
const mockListUsers = vi.mocked(listUsers)
const mockRegister = vi.mocked(register)
const mockLogin = vi.mocked(login)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

const seatAUser: UserResponse = {
  id: '507f1f77bcf86cd799439011',
  username: 'SeatAlpha',
  wins: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const seatBUser: UserResponse = {
  id: '507f1f77bcf86cd799439012',
  username: 'SeatBravo',
  wins: 0,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function seatRegion(seatName: 'Seat A' | 'Seat B') {
  const label = screen.getByText(seatName, { selector: '.step' })
  const region = label.closest('section')

  if (!region) throw new Error(`${seatName} region was not found`)

  return within(region)
}

async function signIn(
  actor: ReturnType<typeof userEvent.setup>,
  seatName: 'Seat A' | 'Seat B',
  username: string,
) {
  const seat = seatRegion(seatName)
  await actor.type(seat.getByLabelText('Username'), username)
  await actor.type(seat.getByLabelText('Password'), 'private password')
  await actor.click(seat.getByRole('button', { name: `Sign in to ${seatName}` }))
}

describe('App', () => {
  beforeEach(() => {
    mockGetHealth.mockResolvedValue({
      status: 'ok',
      service: 'dice-game-api',
    })
    mockListUsers.mockResolvedValue([])
    mockRegister.mockReset()
    mockLogin.mockReset()
    mockGetCurrentUser.mockReset()
  })

  it('shows health and player loading states', () => {
    mockGetHealth.mockReturnValue(new Promise(() => undefined))
    mockListUsers.mockReturnValue(new Promise(() => undefined))

    render(<App />)

    expect(screen.getByText('Checking API...')).toBeInTheDocument()
    expect(screen.getByText('Loading players...')).toBeInTheDocument()
  })

  it('shows connected and empty success states', async () => {
    render(<App />)

    expect(await screen.findByText('dice-game-api connected')).toBeInTheDocument()
    expect(await screen.findByText('No players saved yet.')).toBeInTheDocument()
  })

  it('renders users returned by the public API', async () => {
    mockListUsers.mockResolvedValue([seatAUser])

    render(<App />)

    expect(await screen.findByText('SeatAlpha')).toBeInTheDocument()
  })

  it('shows health and player-list errors', async () => {
    mockGetHealth.mockRejectedValue(new Error('Health offline'))
    mockListUsers.mockRejectedValue(new Error('Users offline'))

    render(<App />)

    expect(await screen.findByText('API unavailable: Health offline')).toBeInTheDocument()
    expect(await screen.findByText('Users offline')).toBeInTheDocument()
  })

  it('registers without creating a session and clears the password field', async () => {
    const actor = userEvent.setup()
    mockRegister.mockResolvedValue(seatAUser)
    render(<App />)

    const seat = seatRegion('Seat A')
    await actor.click(seat.getByRole('button', { name: 'Create account' }))
    await actor.type(seat.getByLabelText('Username'), 'SeatAlpha')
    await actor.type(seat.getByLabelText('Password'), 'private password')
    await actor.click(seat.getAllByRole('button', { name: 'Create account' }).at(-1)!)

    expect(mockRegister).toHaveBeenCalledWith({
      username: 'SeatAlpha',
      password: 'private password',
    })
    expect(
      await seat.findByText(/SeatAlpha was registered/),
    ).toBeInTheDocument()
    expect(seat.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByRole('radio', { name: /Seat A/ })).toBeDisabled()
  })

  it('keeps two sessions independent and selects the exact acting-seat token', async () => {
    const actor = userEvent.setup()
    mockLogin
      .mockResolvedValueOnce({ accessToken: 'token-a', tokenType: 'Bearer', expiresIn: 1800 })
      .mockResolvedValueOnce({ accessToken: 'token-b', tokenType: 'Bearer', expiresIn: 1800 })
    mockGetCurrentUser
      .mockResolvedValueOnce(seatAUser)
      .mockResolvedValueOnce(seatBUser)
    render(<App />)

    await signIn(actor, 'Seat A', 'SeatAlpha')
    expect(await seatRegion('Seat A').findByText(/authenticated as/)).toHaveTextContent('SeatAlpha')
    await signIn(actor, 'Seat B', 'SeatBravo')
    expect(await seatRegion('Seat B').findByText(/authenticated as/)).toHaveTextContent('SeatBravo')

    const seatARadio = screen.getByRole('radio', { name: /Seat A/ })
    const seatBRadio = screen.getByRole('radio', { name: /Seat B/ })
    expect(seatARadio).toBeChecked()

    mockGetCurrentUser.mockResolvedValueOnce(seatBUser)
    await actor.click(seatBRadio)
    await actor.click(screen.getByRole('button', { name: 'Verify acting identity' }))

    expect(mockGetCurrentUser).toHaveBeenLastCalledWith('token-b')
    expect(await screen.findByText(/Backend verified Seat B as/)).toHaveTextContent('SeatBravo')
  })

  it('logs out only one seat and keeps the other seat active', async () => {
    const actor = userEvent.setup()
    mockLogin
      .mockResolvedValueOnce({ accessToken: 'token-a', tokenType: 'Bearer', expiresIn: 1800 })
      .mockResolvedValueOnce({ accessToken: 'token-b', tokenType: 'Bearer', expiresIn: 1800 })
    mockGetCurrentUser
      .mockResolvedValueOnce(seatAUser)
      .mockResolvedValueOnce(seatBUser)
    render(<App />)

    await signIn(actor, 'Seat A', 'SeatAlpha')
    await signIn(actor, 'Seat B', 'SeatBravo')
    await actor.click(seatRegion('Seat A').getByRole('button', { name: 'Log out Seat A' }))

    expect(seatRegion('Seat A').getByRole('button', { name: 'Sign in to Seat A' })).toBeInTheDocument()
    expect(seatRegion('Seat B').getByText(/authenticated as/)).toHaveTextContent('SeatBravo')
    expect(screen.getByRole('radio', { name: /Seat B/ })).toBeChecked()
  })

  it('never writes authenticated sessions to browser storage', async () => {
    const actor = userEvent.setup()
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')
    mockLogin.mockResolvedValue({
      accessToken: 'memory-only-token',
      tokenType: 'Bearer',
      expiresIn: 1800,
    })
    mockGetCurrentUser.mockResolvedValue(seatAUser)
    render(<App />)

    await signIn(actor, 'Seat A', 'SeatAlpha')
    await seatRegion('Seat A').findByText(/authenticated as/)

    expect(localStorageSpy).not.toHaveBeenCalled()
  })

  it('clears only the rejected seat after a protected request returns 401', async () => {
    const actor = userEvent.setup()
    mockLogin.mockResolvedValue({
      accessToken: 'expired-token',
      tokenType: 'Bearer',
      expiresIn: 1800,
    })
    mockGetCurrentUser.mockResolvedValueOnce(seatAUser)
    render(<App />)

    await signIn(actor, 'Seat A', 'SeatAlpha')
    mockGetCurrentUser.mockRejectedValueOnce(new AuthApiError('Unauthorized', 401))
    await actor.click(screen.getByRole('button', { name: 'Verify acting identity' }))

    expect(
      await seatRegion('Seat A').findByText('This session expired or is invalid. Sign in again.'),
    ).toBeInTheDocument()
    expect(seatRegion('Seat A').getByRole('button', { name: 'Sign in to Seat A' })).toBeInTheDocument()
  })
})
