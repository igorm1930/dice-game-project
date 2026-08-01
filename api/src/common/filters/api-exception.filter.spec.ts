import {
  BadRequestException,
  type ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const status = jest.fn();
  const json = jest.fn();
  const response = { status, json } as unknown as Response;
  const request = {
    method: 'POST',
    route: { path: '/games/:id/roll' },
  } as unknown as Request;
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  const filter = new ApiExceptionFilter();
  const loggerError = jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    status.mockReturnValue(response);
  });

  it('preserves explicit safe API errors', () => {
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        code: 'INVALID_GAME_VERSION',
        message: 'If-Match must contain a valid game version.',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'INVALID_GAME_VERSION',
      message: 'If-Match must contain a valid game version.',
    });
  });

  it('normalizes validation errors with a stable code', () => {
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        message: ['opponentId must be a mongodb id'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: ['opponentId must be a mongodb id'],
    });
  });

  it('does not expose unexpected exception details', () => {
    filter.catch(new Error('database credentials appeared here'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error.',
    });
    expect(loggerError).toHaveBeenCalledWith(
      'POST /games/:id/roll failed with 500',
    );
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(
      'database credentials',
    );
  });
});
