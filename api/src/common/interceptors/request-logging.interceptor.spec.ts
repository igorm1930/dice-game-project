import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

describe('RequestLoggingInterceptor', () => {
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        route: { path: '/games/:id' },
        headers: { authorization: 'Bearer secret-token' },
        body: { password: 'secret-password' },
      }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as unknown as ExecutionContext;
  const interceptor = new RequestLoggingInterceptor();

  it('passes successful responses through', async () => {
    const next = { handle: () => of({ ok: true }) } as CallHandler;

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).resolves.toEqual({ ok: true });
  });

  it('preserves request errors', async () => {
    const error = new BadRequestException('invalid');
    const next = {
      handle: () => throwError(() => error),
    } as CallHandler;

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(error);
  });
});
