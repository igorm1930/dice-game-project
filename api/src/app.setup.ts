import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import { configureOpenApi } from './swagger';

export function configureApplication(
  app: INestApplication,
  frontendOrigin: string,
): void {
  const corsOrigin: CustomOrigin = (origin, callback) => {
    callback(null, !origin || origin === frontendOrigin);
  };

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: corsOrigin,
    credentials: false,
  });
  configureOpenApi(app);
}
