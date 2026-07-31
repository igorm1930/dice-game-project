import { NestFactory } from '@nestjs/core';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppModule } from './app.module';

async function bootstrap() {
  const frontendOrigin = process.env.FRONTEND_ORIGIN;

  if (!frontendOrigin) {
    throw new Error('FRONTEND_ORIGIN environment variable is required');
  }

  const corsOrigin: CustomOrigin = (origin, callback) => {
    callback(null, !origin || origin === frontendOrigin);
  };

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigin,
    credentials: false,
  });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
