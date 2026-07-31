import { validateEnvironment } from './environment';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3001',
  FRONTEND_ORIGIN: 'http://localhost:5173',
  MONGODB_URI: 'mongodb://127.0.0.1:27018/dice_game_test',
};

describe('validateEnvironment', () => {
  it('returns typed validated configuration', () => {
    expect(validateEnvironment(validEnvironment)).toMatchObject({
      NODE_ENV: 'test',
      PORT: 3001,
      FRONTEND_ORIGIN: 'http://localhost:5173',
      MONGODB_URI: 'mongodb://127.0.0.1:27018/dice_game_test',
    });
  });

  it('rejects missing required configuration', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, MONGODB_URI: '' }),
    ).toThrow('MONGODB_URI environment variable is required');
  });

  it('rejects an unsupported runtime environment', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, NODE_ENV: 'staging' }),
    ).toThrow('NODE_ENV must be one of development, test, or production');
  });

  it('rejects an invalid port', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, PORT: '70000' }),
    ).toThrow('PORT must be an integer between 1 and 65535');
  });

  it('rejects a frontend URL that is not an exact origin', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        FRONTEND_ORIGIN: 'http://localhost:5173/path',
      }),
    ).toThrow('FRONTEND_ORIGIN must be a valid HTTP origin');
  });

  it('rejects a non-MongoDB connection string', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        MONGODB_URI: 'postgresql://127.0.0.1/dice_game',
      }),
    ).toThrow('MONGODB_URI must use the mongodb or mongodb+srv scheme');
  });
});
