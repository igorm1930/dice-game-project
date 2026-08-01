export class GameVersionConflictError extends Error {
  constructor() {
    super('The game was changed by another request.');
    this.name = 'GameVersionConflictError';
  }
}
