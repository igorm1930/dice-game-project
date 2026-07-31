import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    const headers = request.headers;

    if (headers && typeof headers === 'object') {
      const forwardedFor = (headers as Record<string, unknown>)[
        'x-forwarded-for'
      ];
      if (typeof forwardedFor === 'string') {
        const clientAddress = forwardedFor.split(',')[0]?.trim();

        if (clientAddress) {
          return Promise.resolve(clientAddress);
        }
      }
    }

    const directAddress = request.ip;
    return Promise.resolve(
      typeof directAddress === 'string' && directAddress
        ? directAddress
        : 'unknown-client',
    );
  }
}
