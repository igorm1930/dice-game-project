import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import type { DiceRoller } from './domain/dice-roller';
import { GameEngine } from './domain/game-engine';
import { GameController } from './game.controller';
import { DICE_ROLLER, GAME_REPOSITORY } from './game.constants';
import { GameService } from './game.service';
import { secureDiceRoller } from './infrastructure/secure-dice-roller';
import { MongooseGameRepository } from './repositories/mongoose-game.repository';
import { PersistedGame, PersistedGameSchema } from './schemas/game.schema';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: PersistedGame.name, schema: PersistedGameSchema },
    ]),
  ],
  controllers: [GameController],
  providers: [
    GameService,
    MongooseGameRepository,
    { provide: DICE_ROLLER, useValue: secureDiceRoller },
    {
      provide: GameEngine,
      inject: [DICE_ROLLER],
      useFactory: (diceRoller: DiceRoller) => new GameEngine(diceRoller),
    },
    {
      provide: GAME_REPOSITORY,
      useExisting: MongooseGameRepository,
    },
  ],
})
export class GameModule {}
