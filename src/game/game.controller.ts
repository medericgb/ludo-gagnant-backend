import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { MovePieceDto } from './dto/move-piece.dto';
import { RollDiceDto } from './dto/roll-dice.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGame(@Body() createGameDto: CreateGameDto, @Request() req) {
    return this.gameService.createGame(createGameDto);
  }

  @Get(':id')
  async findGameById(@Param('id') id: string) {
    return this.gameService.findGameById(id);
  }

  @Get('lobby/:lobbyId')
  async findGameByLobbyId(@Param('lobbyId') lobbyId: string) {
    return this.gameService.findGameByLobbyId(lobbyId);
  }

  @Post(':id/join')
  async joinGame(
    @Param('id') id: string,
    @Body() joinGameDto: Partial<JoinGameDto>,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.gameService.joinGame({
      ...joinGameDto,
      gameId: id,
      userId,
    });
  }

  @Post(':id/ready')
  async setPlayerReady(
    @Param('id') id: string,
    @Body('isReady') isReady: boolean,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.gameService.setPlayerReady(id, userId, isReady);
  }

  @Post(':id/roll-dice')
  async rollDice(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.gameService.rollDice({ gameId: id, playerId: userId });
  }

  @Post(':id/move-piece')
  async movePiece(
    @Param('id') id: string,
    @Body() movePieceDto: Partial<MovePieceDto>,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.gameService.movePiece({
      ...movePieceDto,
      gameId: id,
      playerId: userId,
    });
  }
}
