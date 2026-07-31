const defaultTestMongoUri = 'mongodb://127.0.0.1:27018/dice_game_e2e';

process.env.NODE_ENV = 'test';
process.env.PORT ??= '3001';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:5173';
process.env.MONGODB_URI ??= defaultTestMongoUri;

const databaseName = process.env.MONGODB_URI.split('?')[0]
  .split('/')
  .filter(Boolean)
  .at(-1);

if (!databaseName || !/(?:^|[_-])(?:test|e2e)$/i.test(databaseName)) {
  throw new Error(
    'E2E tests require a dedicated MongoDB database ending in _test or _e2e',
  );
}
