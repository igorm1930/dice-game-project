import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { DiceRoll } from '../domain/dice-roller';
import type { GameStatus, PlayerIndex } from '../domain/game.types';

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const objectIdPattern = /^[0-9a-f]{24}$/i;

function isSafeNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isDiceRoll(value: number[] | null): boolean {
  return (
    value === null ||
    (value.length === 2 &&
      value.every((die) => Number.isSafeInteger(die) && die >= 1 && die <= 6))
  );
}

@Schema({ _id: false })
export class PersistedGamePlayer {
  @Prop({ required: true, match: objectIdPattern })
  id!: string;

  @Prop({
    required: true,
    validate: {
      validator: isSafeNonNegativeInteger,
      message: 'Player scores must be non-negative safe integers.',
    },
  })
  globalScore!: number;
}

const PersistedGamePlayerSchema =
  SchemaFactory.createForClass(PersistedGamePlayer);

@Schema({
  collection: 'games',
  timestamps: true,
  versionKey: false,
})
export class PersistedGame {
  @Prop({ required: true, match: uuidV4Pattern })
  _id!: string;

  @Prop({
    type: [PersistedGamePlayerSchema],
    required: true,
    validate: {
      validator: (players: PersistedGamePlayer[]) =>
        players.length === 2 &&
        new Set(players.map((player) => player.id)).size === 2,
      message: 'Games require exactly two distinct players.',
    },
  })
  players!: PersistedGamePlayer[];

  @Prop({ type: Number, required: true, enum: [0, 1] })
  activePlayerIndex!: PlayerIndex;

  @Prop({
    required: true,
    validate: {
      validator: isSafeNonNegativeInteger,
      message: 'Round score must be a non-negative safe integer.',
    },
  })
  roundScore!: number;

  @Prop({
    required: true,
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    validate: Number.isSafeInteger,
  })
  winningScore!: number;

  @Prop({
    type: [Number],
    default: null,
    validate: {
      validator: isDiceRoll,
      message: 'Last roll must be null or exactly two dice from 1 through 6.',
    },
  })
  lastRoll!: DiceRoll | null;

  @Prop({ type: String, required: true, enum: ['active', 'won'] })
  status!: GameStatus;

  @Prop({ type: String, default: null, match: objectIdPattern })
  winnerId!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type PersistedGameDocument = HydratedDocument<PersistedGame>;

export const PersistedGameSchema = SchemaFactory.createForClass(PersistedGame);

PersistedGameSchema.pre('validate', function validateWinnerState() {
  const activePlayer = this.players[this.activePlayerIndex];
  const winnerBelongsToGame = this.players.some(
    (player) => player.id === this.winnerId,
  );

  if (this.status === 'active' && this.winnerId !== null) {
    this.invalidate('winnerId', 'An active game cannot have a winner.');
  }

  if (
    this.status === 'won' &&
    (!this.winnerId ||
      !winnerBelongsToGame ||
      activePlayer?.id !== this.winnerId)
  ) {
    this.invalidate(
      'winnerId',
      'A won game requires its active player to be the winner.',
    );
  }
});
