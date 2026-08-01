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
  GAME_STATE_CONFLICT_RESPONSE,
  INVALID_PLAYERS_RESPONSE,
  NOT_YOUR_TURN_RESPONSE,
  OPPONENT_NOT_FOUND_RESPONSE,
} from './game.constants';
import type {
  GameRecord,
  GameRepository,
} from './repositories/game.repository';
import { GameVersionConflictError } from './repositories/game-repository.errors';

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
    const record = await this.gameRepository.create(state);

    return new GameResponseDto(record, actorId);
  }

  async get(gameId: string, actorId: string): Promise<GameResponseDto> {
    return new GameResponseDto(
      await this.findVisibleGame(gameId, actorId),
      actorId,
    );
  }

  async roll(
    gameId: string,
    actorId: string,
    expectedVersion: number,
  ): Promise<GameResponseDto> {
    const record = await this.findVisibleGame(gameId, actorId);
    this.ensureCurrentVersion(record, expectedVersion);
    this.ensureActorsTurn(record.state, actorId);

    const updated = await this.save({
      ...record,
      state: this.gameEngine.roll(record.state),
    });

    return new GameResponseDto(updated, actorId);
  }

  async hold(
    gameId: string,
    actorId: string,
    expectedVersion: number,
  ): Promise<GameResponseDto> {
    const record = await this.findVisibleGame(gameId, actorId);
    this.ensureCurrentVersion(record, expectedVersion);
    this.ensureActorsTurn(record.state, actorId);

    const updated = await this.save({
      ...record,
      state: this.gameEngine.hold(record.state),
    });
    await this.ensureWinCounted(updated);

    return new GameResponseDto(updated, actorId);
  }

  async restart(
    gameId: string,
    actorId: string,
    expectedVersion: number,
  ): Promise<GameResponseDto> {
    const record = await this.findVisibleGame(gameId, actorId);
    this.ensureCurrentVersion(record, expectedVersion);
    const updated = await this.save({
      ...record,
      state: this.gameEngine.restart(record.state),
    });

    return new GameResponseDto(updated, actorId);
  }

  private async findVisibleGame(
    gameId: string,
    actorId: string,
  ): Promise<GameRecord> {
    const record = await this.gameRepository.findById(gameId);

    if (
      !record ||
      !record.state.players.some((player) => player.id === actorId)
    ) {
      throw new NotFoundException(GAME_NOT_FOUND_RESPONSE);
    }

    await this.ensureWinCounted(record);
    return record;
  }

  private ensureCurrentVersion(
    record: GameRecord,
    expectedVersion: number,
  ): void {
    if (record.version !== expectedVersion) {
      throw new ConflictException(GAME_STATE_CONFLICT_RESPONSE);
    }
  }

  private async save(record: GameRecord): Promise<GameRecord> {
    try {
      return await this.gameRepository.save(record);
    } catch (error: unknown) {
      if (error instanceof GameVersionConflictError) {
        throw new ConflictException(GAME_STATE_CONFLICT_RESPONSE);
      }

      throw error;
    }
  }

  private async ensureWinCounted(record: GameRecord): Promise<void> {
    if (record.state.status === 'won' && record.state.winnerId) {
      await this.usersService.recordGameWin(record.state.winnerId, record.id);
    }
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
