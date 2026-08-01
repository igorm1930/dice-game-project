import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { UserResponseDto } from './dto/user-response.dto';
import { User, type UserDocument } from './schemas/user.schema';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createAuthenticatedUser(input: {
    username: string;
    normalizedUsername: string;
    passwordHash: string;
  }): Promise<UserResponseDto> {
    try {
      const user = await this.userModel.create({
        ...input,
        wins: 0,
      });

      return new UserResponseDto(user);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException({
          statusCode: 409,
          code: 'USERNAME_UNAVAILABLE',
          message: 'Username is unavailable.',
        });
      }

      throw error;
    }
  }

  findForAuthentication(
    normalizedUsername: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ normalizedUsername })
      .select('+passwordHash')
      .exec();
  }

  async recordGameWin(userId: string, winEventId: string): Promise<void> {
    await this.userModel
      .updateOne(
        {
          _id: userId,
          countedWinGameIds: { $ne: winEventId },
        },
        {
          $inc: { wins: 1 },
          $addToSet: { countedWinGameIds: winEventId },
        },
        { runValidators: true },
      )
      .exec();
  }

  async findAuthenticatedById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userModel
      .findOne({ _id: id, passwordHash: { $exists: true } })
      .exec();

    return user ? new UserResponseDto(user) : null;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userModel
      .find()
      .sort({ createdAt: 1, _id: 1 })
      .exec();

    return users.map((user) => new UserResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
  }
}
