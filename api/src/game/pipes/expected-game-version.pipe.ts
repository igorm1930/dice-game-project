import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { INVALID_GAME_VERSION_RESPONSE } from '../game.constants';

const quote = String.fromCharCode(34);
const strongEntityTagPattern = new RegExp(
  '^' + quote + '(0|[1-9][0-9]*)' + quote + '$',
);

export const GameVersionHeader = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<{
      readonly headers: Readonly<Record<string, string | string[] | undefined>>;
    }>();
    const value = request.headers['if-match'];

    return Array.isArray(value) ? undefined : value;
  },
);

@Injectable()
export class ExpectedGameVersionPipe implements PipeTransform<
  string | undefined,
  number
> {
  transform(value: string | undefined): number {
    const match = value?.match(strongEntityTagPattern);

    if (!match) {
      throw new BadRequestException(INVALID_GAME_VERSION_RESPONSE);
    }

    const version = Number(match[1]);

    if (!Number.isSafeInteger(version)) {
      throw new BadRequestException(INVALID_GAME_VERSION_RESPONSE);
    }

    return version;
  }
}
