import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getHealth } from './api/health'
import { createUser, listUsers, type UserResponse } from './api/users'

vi.mock('./api/health', () => ({
  getHealth: vi.fn(),
}))

vi.mock('./api/users', () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
}))

const mockGetHealth = vi.mocked(getHealth)
const mockCreateUser = vi.mocked(createUser)
const mockListUsers = vi.mocked(listUsers)
const savedUser: UserResponse = {
  id: '507f1f77bcf86cd799439011',
  username: 'SavedPlayer',
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

  it('submits the form, shows progress, and appends the created user', async () => {
    const user = userEvent.setup()
    let resolveCreate: (value: UserResponse) => void = () => undefined
    mockCreateUser.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
    )

    render(<App />)
    await screen.findByText('No players saved yet.')

    await user.type(screen.getByLabelText('Username'), 'SavedPlayer')
    await user.click(screen.getByRole('button', { name: 'Create player' }))

    expect(mockCreateUser).toHaveBeenCalledWith('SavedPlayer')
    expect(
      screen.getByRole('button', { name: 'Creating...' }),
    ).toBeDisabled()

    await act(async () => {
      resolveCreate(savedUser)
    })

    expect(await screen.findByText('SavedPlayer')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveValue('')
  })

  it('shows API loading and form errors', async () => {
    const user = userEvent.setup()
    mockGetHealth.mockRejectedValue(new Error('Health offline'))
    mockListUsers.mockRejectedValue(new Error('Users offline'))
    mockCreateUser.mockRejectedValue(new Error('Username is already in use'))

    render(<App />)

    expect(
      await screen.findByText('API unavailable: Health offline'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Users offline')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Username'), 'SavedPlayer')
    await user.click(screen.getByRole('button', { name: 'Create player' }))

    expect(
      await screen.findByText('Username is already in use'),
    ).toBeInTheDocument()
  })
})
