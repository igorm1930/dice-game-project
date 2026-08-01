import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApplication } from './test-application';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApplication();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer()).get('/api/health').expect(200).expect({
      status: 'ok',
      service: 'dice-game-api',
    });
  });

  it('exposes separate liveness and readiness checks', async () => {
    await request(app.getHttpServer()).get('/api/health/live').expect(200);
    await request(app.getHttpServer()).get('/api/health/ready').expect(200);
  });

  it('publishes OpenAPI JSON with JWT and game concurrency contracts', async () => {
    await request(app.getHttpServer())
      .get('/api/openapi.json')
      .expect(200)
      .expect((response) => {
        const document = response.body as {
          readonly paths?: Record<string, unknown>;
          readonly components?: {
            readonly securitySchemes?: Record<string, unknown>;
          };
        };

        expect(document.paths).toHaveProperty('/api/games/{id}/roll');
        expect(document.components?.securitySchemes).toHaveProperty(
          'access-token',
        );
      });
  });

  it('normalizes unmatched route errors', () => {
    return request(app.getHttpServer()).get('/api/missing').expect(404).expect({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /api/missing',
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
