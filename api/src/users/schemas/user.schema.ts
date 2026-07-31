import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, trim: true })
  username!: string;

  @Prop({ required: true, select: false })
  normalizedUsername!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, default: 0, min: 0 })
  wins!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { username: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
    name: 'users_username_unique_ci',
  },
);

UserSchema.index(
  { normalizedUsername: 1 },
  {
    unique: true,
    partialFilterExpression: { normalizedUsername: { $type: 'string' } },
    name: 'users_normalized_username_unique',
  },
);
