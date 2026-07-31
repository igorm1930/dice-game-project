import { NestFactory } from '@nestjs/core';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { EnvironmentVariables } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const frontendOrigin = configService.get('FRONTEND_ORIGIN', { infer: true });
  const port = configService.get('PORT', { infer: true });
  const corsOrigin: CustomOrigin = (origin, callback) => {
    callback(null, !origin || origin === frontendOrigin);
  };

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigin,
    credentials: false,
  });
  await app.listen(port);
}

void bootstrap();
