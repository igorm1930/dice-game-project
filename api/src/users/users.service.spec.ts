import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types, type Model } from 'mongoose';
import { UsersService } from './users.service';
import type { UserDocument } from './schemas/user.schema';

describe('UsersService', () => {
  const create = jest.fn();
  const findExec = jest.fn();
  const sort = jest.fn(() => ({ exec: findExec }));
  const find = jest.fn(() => ({ sort }));
  const findByIdExec = jest.fn();
  const findById = jest.fn(() => ({ exec: findByIdExec }));
  const userModel = {
    create,
    find,
    findById,
  } as unknown as Model<UserDocument>;
  const firstUser = {
    _id: new Types.ObjectId(),
    username: 'FirstUser',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const secondUser = {
    _id: new Types.ObjectId(),
    username: 'SecondUser',
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(userModel);
  });

  it('creates a user and returns the public response', async () => {
    create.mockResolvedValue(firstUser);

    await expect(service.create({ username: 'FirstUser' })).resolves.toEqual({
      id: firstUser._id.toString(),
      username: 'FirstUser',
      createdAt: firstUser.createdAt,
      updatedAt: firstUser.updatedAt,
    });
    expect(create).toHaveBeenCalledWith({ username: 'FirstUser' });
  });

  it('maps a duplicate database error to a conflict', async () => {
    create.mockRejectedValue({ code: 11000 });

    await expect(service.create({ username: 'FirstUser' })).rejects.toThrow(
      new ConflictException('Username is already in use'),
    );
  });

  it('lists users in stable creation order', async () => {
    findExec.mockResolvedValue([firstUser, secondUser]);

    await expect(service.findAll()).resolves.toEqual([
      expect.objectContaining({ username: 'FirstUser' }),
      expect.objectContaining({ username: 'SecondUser' }),
    ]);
    expect(sort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
  });

  it('returns one user by id', async () => {
    findByIdExec.mockResolvedValue(firstUser);

    await expect(service.findOne(firstUser._id.toString())).resolves.toEqual(
      expect.objectContaining({
        id: firstUser._id.toString(),
        username: 'FirstUser',
      }),
    );
    expect(findById).toHaveBeenCalledWith(firstUser._id.toString());
  });

  it('rejects an unknown user id', async () => {
    findByIdExec.mockResolvedValue(null);

    await expect(
      service.findOne(new Types.ObjectId().toString()),
    ).rejects.toThrow(new NotFoundException('User not found'));
  });
});
