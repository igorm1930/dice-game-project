import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { DatabaseHealthService } from '../database/database-health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  @Get()
  @ApiOperation({ summary: 'Compatibility readiness check' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorResponseDto })
  getHealth(): HealthResponseDto {
    return this.getReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Process liveness check' })
  @ApiOkResponse({ type: HealthResponseDto })
  getLiveness(): HealthResponseDto {
    return new HealthResponseDto();
  }

  @Get('ready')
  @ApiOperation({ summary: 'MongoDB readiness check' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: ApiErrorResponseDto })
  getReadiness(): HealthResponseDto {
    if (!this.databaseHealth.isConnected()) {
      throw new ServiceUnavailableException(
        'Database connection is unavailable',
      );
    }

    return new HealthResponseDto();
  }
}
