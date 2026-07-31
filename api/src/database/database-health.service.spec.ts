import { ConnectionStates, type Connection } from 'mongoose';
import { DatabaseHealthService } from './database-health.service';

describe('DatabaseHealthService', () => {
  it('reports a connected Mongoose connection', () => {
    const connection = { readyState: ConnectionStates.connected } as Connection;
    const service = new DatabaseHealthService(connection);

    expect(service.isConnected()).toBe(true);
  });

  it('reports a disconnected Mongoose connection', () => {
    const connection = {
      readyState: ConnectionStates.disconnected,
    } as Connection;
    const service = new DatabaseHealthService(connection);

    expect(service.isConnected()).toBe(false);
  });
});
