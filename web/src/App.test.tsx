import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getHealth } from './api/health'
import { listUsers, type UserResponse } from './api/users'

vi.mock('./api/health', () => ({
  getHealth: vi.fn(),
}))

vi.mock('./api/users', () => ({
  listUsers: vi.fn(),
}))

const mockGetHealth = vi.mocked(getHealth)
const mockListUsers = vi.mocked(listUsers)
const savedUser: UserResponse = {
  id: '507f1f77bcf86cd799439011',
  username: 'SavedPlayer',
  wins: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('App', () => {
  beforeEach(() => {
    mockGetHealth.mockResolvedValue({
      status: 'ok',
      service: 'dice-game-api',
    })
    mockListUsers.mockResolvedValue([])
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

    expect(
      await screen.findByText('dice-game-api connected'),
    ).toBeInTheDocument()
    expect(await screen.findByText('No players saved yet.')).toBeInTheDocument()
  })

  it('renders users returned by the API', async () => {
    mockListUsers.mockResolvedValue([savedUser])

    render(<App />)

    expect(await screen.findByText('SavedPlayer')).toBeInTheDocument()
  })

  it('shows API and player-list errors', async () => {
    mockGetHealth.mockRejectedValue(new Error('Health offline'))
    mockListUsers.mockRejectedValue(new Error('Users offline'))

    render(<App />)

    expect(
      await screen.findByText('API unavailable: Health offline'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Users offline')).toBeInTheDocument()

  })
})
