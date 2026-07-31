import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { GameEngine } from './domain/game-engine';
import type { GameState } from './domain/game.types';
import type { CreateGameDto } from './dto/create-game.dto';
import { GameResponseDto } from './dto/game-response.dto';
import {
  GAME_FINISHED_RESPONSE,
  GAME_NOT_FOUND_RESPONSE,
  GAME_REPOSITORY,
  INVALID_PLAYERS_RESPONSE,
  NOT_YOUR_TURN_RESPONSE,
  OPPONENT_NOT_FOUND_RESPONSE,
} from './game.constants';
import type {
  GameRecord,
  GameRepository,
} from './repositories/game.repository';

@Injectable()
export class GameService {
  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly gameRepository: GameRepository,
    private readonly gameEngine: GameEngine,
    private readonly usersService: UsersService,
  ) {}

  async create(
    actorId: string,
    createGameDto: CreateGameDto,
  ): Promise<GameResponseDto> {
    if (actorId === createGameDto.opponentId) {
      throw new BadRequestException(INVALID_PLAYERS_RESPONSE);
    }

    const opponent = await this.usersService.findAuthenticatedById(
      createGameDto.opponentId,
    );

    if (!opponent) {
      throw new NotFoundException(OPPONENT_NOT_FOUND_RESPONSE);
    }

    const state = this.gameEngine.createGame(
      [actorId, opponent.id],
      createGameDto.winningScore,
    );
    const record = this.gameRepository.create(state);

    return new GameResponseDto(record, actorId);
  }

  get(gameId: string, actorId: string): GameResponseDto {
    return new GameResponseDto(this.findVisibleGame(gameId, actorId), actorId);
  }

  roll(gameId: string, actorId: string): GameResponseDto {
    const record = this.findVisibleGame(gameId, actorId);
    this.ensureActorsTurn(record.state, actorId);

    const updated = this.gameRepository.save({
      ...record,
      state: this.gameEngine.roll(record.state),
    });

    return new GameResponseDto(updated, actorId);
  }

  hold(gameId: string, actorId: string): GameResponseDto {
    const record = this.findVisibleGame(gameId, actorId);
    this.ensureActorsTurn(record.state, actorId);

    const updated = this.gameRepository.save({
      ...record,
      state: this.gameEngine.hold(record.state),
    });

    return new GameResponseDto(updated, actorId);
  }

  restart(gameId: string, actorId: string): GameResponseDto {
    const record = this.findVisibleGame(gameId, actorId);
    const updated = this.gameRepository.save({
      ...record,
      state: this.gameEngine.restart(record.state),
    });

    return new GameResponseDto(updated, actorId);
  }

  private findVisibleGame(gameId: string, actorId: string): GameRecord {
    const record = this.gameRepository.findById(gameId);

    if (
      !record ||
      !record.state.players.some((player) => player.id === actorId)
    ) {
      throw new NotFoundException(GAME_NOT_FOUND_RESPONSE);
    }

    return record;
  }

  private ensureActorsTurn(state: GameState, actorId: string): void {
    if (state.status !== 'active') {
      throw new ConflictException(GAME_FINISHED_RESPONSE);
    }

    if (state.players[state.activePlayerIndex].id !== actorId) {
      throw new ConflictException(NOT_YOUR_TURN_RESPONSE);
    }
  }
}
