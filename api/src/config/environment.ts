export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  FRONTEND_ORIGIN: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: '30m';
  JWT_ISSUER: 'dice-game-api';
  JWT_AUDIENCE: 'dice-game-web';
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

function requiredSecret(
  config: Record<string, unknown>,
  key: 'JWT_SECRET',
): string {
  const value = config[key];

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} environment variable is required`);
  }

  return value;
}

function validateFrontendOrigin(
  value: string,
  nodeEnvironment: NodeEnvironment,
): string {
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

  if (nodeEnvironment === 'production' && url.protocol !== 'https:') {
    throw new Error('FRONTEND_ORIGIN must use HTTPS in production');
  }

  return value;
}

function validateMongoUri(
  value: string,
  nodeEnvironment: NodeEnvironment,
): string {
  if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must use the mongodb or mongodb+srv scheme');
  }

  const authorityStart = value.indexOf('://') + 3;
  const databasePathStart = value.indexOf('/', authorityStart);
  const databaseName =
    databasePathStart === -1
      ? ''
      : value.slice(databasePathStart + 1).split('?')[0];

  if (!databaseName) {
    throw new Error('MONGODB_URI must include a database name');
  }

  if (nodeEnvironment === 'production' && !value.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must use mongodb+srv in production');
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

  const typedNodeEnvironment = nodeEnv as NodeEnvironment;
  const frontendOrigin = validateFrontendOrigin(
    requiredString(config, 'FRONTEND_ORIGIN'),
    typedNodeEnvironment,
  );
  const mongodbUri = validateMongoUri(
    requiredString(config, 'MONGODB_URI'),
    typedNodeEnvironment,
  );
  const jwtSecret = requiredSecret(config, 'JWT_SECRET');

  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }

  const jwtExpiresIn = requiredString(config, 'JWT_EXPIRES_IN');
  if (jwtExpiresIn !== '30m') {
    throw new Error('JWT_EXPIRES_IN must be 30m');
  }

  const jwtIssuer = requiredString(config, 'JWT_ISSUER');
  if (jwtIssuer !== 'dice-game-api') {
    throw new Error('JWT_ISSUER must be dice-game-api');
  }

  const jwtAudience = requiredString(config, 'JWT_AUDIENCE');
  if (jwtAudience !== 'dice-game-web') {
    throw new Error('JWT_AUDIENCE must be dice-game-web');
  }

  return {
    ...config,
    NODE_ENV: typedNodeEnvironment,
    PORT: port,
    FRONTEND_ORIGIN: frontendOrigin,
    MONGODB_URI: mongodbUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_ISSUER: jwtIssuer,
    JWT_AUDIENCE: jwtAudience,
  };
}
