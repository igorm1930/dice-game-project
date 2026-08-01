import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  readonly statusCode?: unknown;
  readonly code?: unknown;
  readonly message?: unknown;
}

const defaultCodes: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};
const internalServerErrorStatus = Number(HttpStatus.INTERNAL_SERVER_ERROR);

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

function errorPayload(exception: unknown): {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string | string[];
} {
  const statusCode =
    exception instanceof HttpException
      ? exception.getStatus()
      : internalServerErrorStatus;
  const response =
    exception instanceof HttpException ? exception.getResponse() : undefined;
  const details: ErrorResponse =
    typeof response === 'object' && response !== null ? response : {};
  const responseMessage =
    typeof response === 'string' ? response : details.message;
  const message =
    statusCode === internalServerErrorStatus
      ? 'Internal server error.'
      : typeof responseMessage === 'string' ||
          (Array.isArray(responseMessage) &&
            responseMessage.every((item) => typeof item === 'string'))
        ? responseMessage
        : 'Request failed.';

  return {
    statusCode,
    code:
      typeof details.code === 'string'
        ? details.code
        : (defaultCodes[statusCode] ?? 'HTTP_ERROR'),
    message,
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const payload = errorPayload(exception);

    if (payload.statusCode >= internalServerErrorStatus) {
      const route = routePath(request);
      this.logger.error(
        `${request.method} ${route} failed with ${payload.statusCode}`,
      );
    }

    response.status(payload.statusCode).json(payload);
  }
}
