import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { DatabaseHealthService } from '../database/database-health.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const databaseHealth = {
    isConnected: jest.fn(),
  };

  beforeEach(async () => {
    databaseHealth.isConnected.mockReset().mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseHealthService,
          useValue: databaseHealth,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns the API health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'dice-game-api',
    });
  });

  it('reports liveness without depending on MongoDB readiness', () => {
    databaseHealth.isConnected.mockReturnValue(false);

    expect(controller.getLiveness()).toEqual({
      status: 'ok',
      service: 'dice-game-api',
    });
    expect(databaseHealth.isConnected).not.toHaveBeenCalled();
  });

  it('reports readiness while MongoDB is connected', () => {
    expect(controller.getReadiness()).toEqual({
      status: 'ok',
      service: 'dice-game-api',
    });
  });

  it('rejects the health request while MongoDB is disconnected', () => {
    databaseHealth.isConnected.mockReturnValue(false);

    expect(() => controller.getReadiness()).toThrow(
      ServiceUnavailableException,
    );
    expect(() => controller.getHealth()).toThrow(ServiceUnavailableException);
  });
});
