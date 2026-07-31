import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';
import type { EnvironmentVariables } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const frontendOrigin = configService.get('FRONTEND_ORIGIN', { infer: true });
  const port = configService.get('PORT', { infer: true });

  configureApplication(app, frontendOrigin);
  await app.listen(port);
}

void bootstrap();
