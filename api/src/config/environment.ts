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

  return {
    ...config,
    NODE_ENV: typedNodeEnvironment,
    PORT: port,
    FRONTEND_ORIGIN: frontendOrigin,
    MONGODB_URI: mongodbUri,
  };
}
