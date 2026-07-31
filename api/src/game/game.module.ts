import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import type { DiceRoller } from './domain/dice-roller';
import { GameEngine } from './domain/game-engine';
import { GameController } from './game.controller';
import { DICE_ROLLER, GAME_REPOSITORY } from './game.constants';
import { GameService } from './game.service';
import { secureDiceRoller } from './infrastructure/secure-dice-roller';
import { InMemoryGameRepository } from './repositories/in-memory-game.repository';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [GameController],
  providers: [
    GameService,
    InMemoryGameRepository,
    { provide: DICE_ROLLER, useValue: secureDiceRoller },
    {
      provide: GameEngine,
      inject: [DICE_ROLLER],
      useFactory: (diceRoller: DiceRoller) => new GameEngine(diceRoller),
    },
    {
      provide: GAME_REPOSITORY,
      useExisting: InMemoryGameRepository,
    },
  ],
})
export class GameModule {}
