import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, tap, throwError, type Observable } from 'rxjs';

function routePath(request: Request): string {
  const route: unknown = request.route;

  if (
    typeof route === 'object' &&
    route !== null &&
    'path' in route &&
    typeof route.path === 'string'
  ) {
    return route.path;
  }

  return 'unmatched-route';
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = performance.now();

    const log = (statusCode: number): void => {
      const route = routePath(request);
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      this.logger.log(
        `${request.method} ${route} ${statusCode} ${durationMs}ms`,
      );
    };

    return next.handle().pipe(
      tap(() => log(response.statusCode)),
      catchError((error: unknown) => {
        log(error instanceof HttpException ? error.getStatus() : 500);
        return throwError(() => error);
      }),
    );
  }
}
