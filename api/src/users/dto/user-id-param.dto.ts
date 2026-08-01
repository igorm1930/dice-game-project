import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserIdParamDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  id!: string;
}
