import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEmpty } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/access-token-payload';
import { CreateGameDto } from './dto/create-game.dto';
import { GameIdParamDto } from './dto/game-id-param.dto';
import { GameResponseDto } from './dto/game-response.dto';
import { GameService } from './game.service';

class EmptyGameActionDto {
  @IsEmpty()
  readonly _empty?: never;
}

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createGameDto: CreateGameDto,
  ): Promise<GameResponseDto> {
    return this.gameService.create(currentUser.id, createGameDto);
  }

  @Get(':id')
  get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
  ): Promise<GameResponseDto> {
    return this.gameService.get(params.id, currentUser.id);
  }

  @Post(':id/roll')
  @HttpCode(HttpStatus.OK)
  roll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
    @Body() _body: EmptyGameActionDto,
  ): Promise<GameResponseDto> {
    void _body;
    return this.gameService.roll(params.id, currentUser.id);
  }

  @Post(':id/hold')
  @HttpCode(HttpStatus.OK)
  hold(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
    @Body() _body: EmptyGameActionDto,
  ): Promise<GameResponseDto> {
    void _body;
    return this.gameService.hold(params.id, currentUser.id);
  }

  @Post(':id/restart')
  @HttpCode(HttpStatus.OK)
  restart(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param() params: GameIdParamDto,
    @Body() _body: EmptyGameActionDto,
  ): Promise<GameResponseDto> {
    void _body;
    return this.gameService.restart(params.id, currentUser.id);
  }
}
