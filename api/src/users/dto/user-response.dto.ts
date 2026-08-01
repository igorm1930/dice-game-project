import type { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export interface UserResponseSource {
  _id: Types.ObjectId;
  username: string;
  wins?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  readonly id: string;

  @ApiProperty({ example: 'PlayerOne' })
  readonly username: string;

  @ApiProperty({ example: 3, minimum: 0 })
  readonly wins: number;

  @ApiProperty({ type: String, format: 'date-time' })
  readonly createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  readonly updatedAt: Date;

  constructor(user: UserResponseSource) {
    this.id = user._id.toString();
    this.username = user.username;
    this.wins = user.wins ?? 0;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
