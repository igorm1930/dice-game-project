import type { Types } from 'mongoose';

export interface UserResponseSource {
  _id: Types.ObjectId;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserResponseDto {
  readonly id: string;
  readonly username: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(user: UserResponseSource) {
    this.id = user._id.toString();
    this.username = user.username;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
