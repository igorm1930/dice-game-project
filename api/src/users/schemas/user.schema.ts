import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  @Prop({
    type: [String],
    default: [],
    select: false,
    validate: {
      validator: (gameIds: string[]) =>
        gameIds.every((gameId) => uuidV4Pattern.test(gameId)),
      message: 'Counted win game IDs must be UUID v4 values.',
    },
  })
  countedWinGameIds!: string[];

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
