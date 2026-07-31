import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import type { EnvironmentVariables } from '../src/config/environment';
import type { DiceRoller } from '../src/game/domain/dice-roller';
import { DICE_ROLLER } from '../src/game/game.constants';

interface TestApplicationOptions {
  readonly diceRoller?: DiceRoller;
}

export async function createTestApplication(
  options: TestApplicationOptions = {},
): Promise<INestApplication<App>> {
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (options.diceRoller) {
    moduleBuilder.overrideProvider(DICE_ROLLER).useValue(options.diceRoller);
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();
  const application =
    moduleFixture.createNestApplication<INestApplication<App>>();
  const configService = application.get(
    ConfigService<EnvironmentVariables, true>,
  );
  const frontendOrigin = configService.get('FRONTEND_ORIGIN', { infer: true });

  configureApplication(application, frontendOrigin);
  await application.init();

  return application;
}
