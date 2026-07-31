import { argon2id } from 'argon2';

export const ARGON2_OPTIONS = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const ACCESS_TOKEN_TTL_SECONDS = 30 * 60;
export const INVALID_CREDENTIALS_RESPONSE = {
  statusCode: 401,
  code: 'INVALID_CREDENTIALS',
  message: 'Invalid username or password.',
} as const;
export const UNAUTHORIZED_RESPONSE = {
  statusCode: 401,
  code: 'UNAUTHORIZED',
  message: 'Authentication required.',
} as const;
