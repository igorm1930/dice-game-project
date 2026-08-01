import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Dice Game API')
    .setDescription(
      'Authenticated two-player dice game API with backend-owned rules and state.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by POST /api/auth/login.',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/openapi.json',
    swaggerOptions: {
      persistAuthorization: false,
    },
  });
}
