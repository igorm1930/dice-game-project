import { BadRequestException } from '@nestjs/common';
import { ExpectedGameVersionPipe } from './expected-game-version.pipe';

describe('ExpectedGameVersionPipe', () => {
  const pipe = new ExpectedGameVersionPipe();
  const entityTag = (version: string): string =>
    String.fromCharCode(34) + version + String.fromCharCode(34);

  it.each([
    [entityTag('0'), 0],
    [entityTag('12'), 12],
    [entityTag('9007199254740991'), Number.MAX_SAFE_INTEGER],
  ])('parses strong version entity tag %s', (value, expected) => {
    expect(pipe.transform(value)).toBe(expected);
  });

  it.each([
    undefined,
    '',
    '0',
    'W/' + entityTag('0'),
    entityTag('01'),
    entityTag('-1'),
    entityTag('9007199254740992'),
  ])('rejects missing or invalid version %p', (value) => {
    expect(() => pipe.transform(value)).toThrow(BadRequestException);
  });
});
