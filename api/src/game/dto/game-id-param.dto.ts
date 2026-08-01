import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GameIdParamDto {
  @ApiProperty({
    format: 'uuid',
    example: 'd43acc2f-a715-49a1-bf4f-74b16592e553',
  })
  @IsUUID('4')
  id!: string;
}
