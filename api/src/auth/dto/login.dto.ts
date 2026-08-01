import { Transform, type TransformFnParams } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class LoginDto {
  @ApiProperty({ example: 'PlayerOne', minLength: 3, maxLength: 30 })
  @Transform((params: TransformFnParams) => trimString(params.value))
  @ApiProperty({
    example: 'a-long-demo-password',
    minLength: 10,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @Length(3, 30)
  @Matches(usernamePattern, {
    message:
      'username may contain only letters, numbers, dots, underscores, and hyphens',
  })
  username!: string;

  @IsString()
  @Length(10, 128)
  password!: string;
}
