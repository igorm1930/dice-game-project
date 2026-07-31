import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConnectionStates, type Connection } from 'mongoose';

@Injectable()
export class DatabaseHealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  isConnected(): boolean {
    return this.connection.readyState === ConnectionStates.connected;
  }
}
