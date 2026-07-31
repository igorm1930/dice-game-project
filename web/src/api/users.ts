import { config } from '../config'

export interface UserResponse {
  id: string
  username: string
  createdAt: string
  updatedAt: string
}

function isUserResponse(value: unknown): value is UserResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const user = value as Record<string, unknown>

  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.createdAt === 'string' &&
    typeof user.updatedAt === 'string'
  )
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`

  try {
    const data: unknown = await response.json()

    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as Record<string, unknown>).message

      if (typeof message === 'string') {
        return message
      }

      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message.join('. ')
      }
    }
  } catch {
    return fallback
  }

  return fallback
}

export async function listUsers(signal?: AbortSignal): Promise<UserResponse[]> {
  const response = await fetch(`${config.apiUrl}/api/users`, { signal })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data) || !data.every(isUserResponse)) {
    throw new Error('Users response has an unexpected format')
  }

  return data
}

export async function createUser(username: string): Promise<UserResponse> {
  const response = await fetch(`${config.apiUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data: unknown = await response.json()

  if (!isUserResponse(data)) {
    throw new Error('User response has an unexpected format')
  }

  return data
}
