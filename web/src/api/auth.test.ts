import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUser, login, register } from './auth'

vi.mock('../config', () => ({
  config: { apiUrl: 'http://localhost:3000' },
}))

const user = {
  id: '507f1f77bcf86cd799439011',
  username: 'SeatPlayer',
  wins: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('authentication API client', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('registers with the supplied credentials without an authorization header', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(user), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      register({ username: 'SeatPlayer', password: 'private password' }),
    ).resolves.toEqual(user)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'SeatPlayer',
          password: 'private password',
        }),
      }),
    )
  })

  it('validates a successful login response', async () => {
    const tokenResponse = {
      accessToken: 'seat-token',
      tokenType: 'Bearer' as const,
      expiresIn: 1800,
    }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(tokenResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      login({ username: 'SeatPlayer', password: 'private password' }),
    ).resolves.toEqual(tokenResponse)
  })

  it('sends the exact selected bearer token to the current-user endpoint', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(getCurrentUser('seat-a-token')).resolves.toEqual(user)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer seat-a-token' },
      }),
    )
  })

  it('preserves the backend status, code, and safe error message', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const request = login({
      username: 'SeatPlayer',
      password: 'incorrect password',
    })

    await expect(request).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password.',
    })
  })

  it('rejects malformed successful responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accessToken: 'token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      login({ username: 'SeatPlayer', password: 'private password' }),
    ).rejects.toThrow('Login response has an unexpected format')
  })
})
