import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseHealthService } from '../database/database-health.service';

export interface HealthResponse {
  status: 'ok';
  service: 'dice-game-api';
}

@Controller('health')
export class HealthController {
  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  @Get()
  getHealth(): HealthResponse {
    if (!this.databaseHealth.isConnected()) {
      throw new ServiceUnavailableException(
        'Database connection is unavailable',
      );
    }

    return {
      status: 'ok',
      service: 'dice-game-api',
    };
  }
}
