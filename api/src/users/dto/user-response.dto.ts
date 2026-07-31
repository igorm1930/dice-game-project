import type { Types } from 'mongoose';

export interface UserResponseSource {
  _id: Types.ObjectId;
  username: string;
  wins?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserResponseDto {
  readonly id: string;
  readonly username: string;
  readonly wins: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(user: UserResponseSource) {
    this.id = user._id.toString();
    this.username = user.username;
    this.wins = user.wins ?? 0;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
