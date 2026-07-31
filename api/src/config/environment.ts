export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  FRONTEND_ORIGIN: string;
  MONGODB_URI: string;
}

const nodeEnvironments: NodeEnvironment[] = [
  'development',
  'test',
  'production',
];

function requiredString(
  config: Record<string, unknown>,
  key: keyof EnvironmentVariables,
): string {
  const value = config[key];

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} environment variable is required`);
  }

  return value.trim();
}

function validateFrontendOrigin(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a valid HTTP origin');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.origin !== value ||
    url.username ||
    url.password
  ) {
    throw new Error('FRONTEND_ORIGIN must be a valid HTTP origin');
  }

  return value;
}

function validateMongoUri(value: string): string {
  if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must use the mongodb or mongodb+srv scheme');
  }

  return value;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> & EnvironmentVariables {
  const nodeEnv = requiredString(config, 'NODE_ENV');

  if (!nodeEnvironments.includes(nodeEnv as NodeEnvironment)) {
    throw new Error('NODE_ENV must be one of development, test, or production');
  }

  const portValue = requiredString(config, 'PORT');
  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const frontendOrigin = validateFrontendOrigin(
    requiredString(config, 'FRONTEND_ORIGIN'),
  );
  const mongodbUri = validateMongoUri(requiredString(config, 'MONGODB_URI'));

  return {
    ...config,
    NODE_ENV: nodeEnv as NodeEnvironment,
    PORT: port,
    FRONTEND_ORIGIN: frontendOrigin,
    MONGODB_URI: mongodbUri,
  };
}
