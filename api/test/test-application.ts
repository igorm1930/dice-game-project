import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import type { EnvironmentVariables } from '../src/config/environment';

export async function createTestApplication(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
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
