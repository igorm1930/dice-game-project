import { config } from '../config'
import type { UserResponse } from './users'

export interface AuthCredentials {
  username: string
  password: string
}

export interface AuthTokenResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export class AuthApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isUserResponse(value: unknown): value is UserResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.username === 'string' &&
    typeof value.wins === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

function isAuthTokenResponse(value: unknown): value is AuthTokenResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    value.tokenType === 'Bearer' &&
    typeof value.expiresIn === 'number' &&
    Number.isInteger(value.expiresIn) &&
    value.expiresIn > 0
  )
}

async function readError(response: Response): Promise<AuthApiError> {
  const fallback = `Request failed with status ${response.status}`

  try {
    const data: unknown = await response.json()

    if (isRecord(data)) {
      const message = Array.isArray(data.message)
        ? data.message.filter((item): item is string => typeof item === 'string').join('. ')
        : data.message

      return new AuthApiError(
        typeof message === 'string' && message ? message : fallback,
        response.status,
        typeof data.code === 'string' ? data.code : undefined,
      )
    }
  } catch {
    return new AuthApiError(fallback, response.status)
  }

  return new AuthApiError(fallback, response.status)
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw await readError(response)
  }

  return response.json()
}

export async function register(
  credentials: AuthCredentials,
  signal?: AbortSignal,
): Promise<UserResponse> {
  const response = await fetch(`${config.apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    signal,
  })
  const data = await readJson(response)

  if (!isUserResponse(data)) {
    throw new Error('Registration response has an unexpected format')
  }

  return data
}

export async function login(
  credentials: AuthCredentials,
  signal?: AbortSignal,
): Promise<AuthTokenResponse> {
  const response = await fetch(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    signal,
  })
  const data = await readJson(response)

  if (!isAuthTokenResponse(data)) {
    throw new Error('Login response has an unexpected format')
  }

  return data
}

export async function getCurrentUser(
  accessToken: string,
  signal?: AbortSignal,
): Promise<UserResponse> {
  const response = await fetch(`${config.apiUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  })
  const data = await readJson(response)

  if (!isUserResponse(data)) {
    throw new Error('Current-user response has an unexpected format')
  }

  return data
}
