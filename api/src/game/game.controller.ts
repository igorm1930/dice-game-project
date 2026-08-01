import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { IsEmpty } from 'class-validator';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/access-token-payload';
import { CreateGameDto } from './dto/create-game.dto';
import { GameIdParamDto } from './dto/game-id-param.dto';
import { GameResponseDto } from './dto/game-response.dto';
import { GameService } from './game.service';
import {
  ExpectedGameVersionPipe,
  GameVersionHeader,
} from './pipes/expected-game-version.pipe';

class EmptyGameActionDto {
  @IsEmpty()
  readonly _empty?: never;
}

@Controller('games')
@UseGuards(JwtAuthGuard)
@ApiTags('games')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @ApiOperation({ summary: 'Create a game as Player 1' })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createGameDto: CreateGameDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GameResponseDto> {
    return this.withEtag(
      response,
      await this.gameService.create(currentUser.id, createGameDto),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get participant-visible game state' })
  @ApiOkResponse({ type: GameResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GameResponseDto> {
    return this.withEtag(
      response,
      await this.gameService.get(params.id, currentUser.id),
    );
  }

  @Post(':id/roll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Roll for the authenticated active player' })
  @ApiHeader({
    name: 'If-Match',
    description: 'Quoted version returned by the latest game response.',
    required: true,
  })
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  @ApiOkResponse({ type: GameResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async roll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
    @Body() _body: EmptyGameActionDto,
    @GameVersionHeader(ExpectedGameVersionPipe) expectedVersion: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GameResponseDto> {
    void _body;
    return this.withEtag(
      response,
      await this.gameService.roll(params.id, currentUser.id, expectedVersion),
    );
  }

  @Post(':id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bank the active round score and pass the turn' })
  @ApiHeader({
    name: 'If-Match',
    description: 'Quoted version returned by the latest game response.',
    required: true,
  })
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  @ApiOkResponse({ type: GameResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async hold(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
    @Body() _body: EmptyGameActionDto,
    @GameVersionHeader(ExpectedGameVersionPipe) expectedVersion: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GameResponseDto> {
    void _body;
    return this.withEtag(
      response,
      await this.gameService.hold(params.id, currentUser.id, expectedVersion),
    );
  }

  @Post(':id/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restart a participant game' })
  @ApiHeader({
    name: 'If-Match',
    description: 'Quoted version returned by the latest game response.',
    required: true,
  })
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  @ApiOkResponse({ type: GameResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  async restart(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
    @Body() _body: EmptyGameActionDto,
    @GameVersionHeader(ExpectedGameVersionPipe) expectedVersion: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GameResponseDto> {
    void _body;
    return this.withEtag(
      response,
      await this.gameService.restart(
        params.id,
        currentUser.id,
        expectedVersion,
      ),
    );
  }

  private withEtag(response: Response, game: GameResponseDto): GameResponseDto {
    const quote = String.fromCharCode(34);
    response.setHeader('ETag', quote + game.version + quote);
    return game;
  }
}
