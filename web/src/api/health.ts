import { config } from '../config';

export interface HealthResponse {
  status: 'ok';
  service: 'dice-game-api';
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Record<string, unknown>;

  return response.status === 'ok' && response.service === 'dice-game-api';
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${config.apiUrl}/api/health`, { signal });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!isHealthResponse(data)) {
    throw new Error('Health response has an unexpected format');
  }

  return data;
}
