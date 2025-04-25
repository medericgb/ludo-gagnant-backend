import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { JoinGameDto } from './dto/join-game.dto';
import { MovePieceDto } from './dto/move-piece.dto';
import { RollDiceDto } from './dto/roll-dice.dto';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly gameService: GameService) {}

  async handleConnection(client: Socket) {
    const user = client.handshake.auth.token
      ? await this.validateToken(client.handshake.auth.token)
      : null;

    if (!user) {
      client.disconnect();
      return;
    }

    client.data.user = user;
    console.log(`Client connected: ${client.id} - User: ${user.username}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  private async validateToken(token: string) {
    try {
      // This would be handled by your JWT service
      // For now just returning a dummy user
      return { userId: 'dummy-user-id', username: 'dummy-user' };
    } catch (error) {
      return null;
    }
  }

  @SubscribeMessage('joinGameRoom')
  async handleJoinGame(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = `game:${gameId}`;
      await client.join(room);

      const game = await this.gameService.findGameById(gameId);
      this.server.to(room).emit('gameStateUpdated', game);

      return { event: 'joinedGameRoom', data: { gameId } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('leaveGameRoom')
  async handleLeaveGame(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `game:${gameId}`;
    await client.leave(room);
    return { event: 'leftGameRoom', data: { gameId } };
  }

  @SubscribeMessage('joinGame')
  async handleJoinGameAsPlayer(
    @MessageBody() data: JoinGameDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, userId, color } = data;
      const game = await this.gameService.joinGame({ gameId, userId, color });

      const room = `game:${gameId}`;
      this.server.to(room).emit('gameStateUpdated', game);
      this.server.to(room).emit('playerJoined', { userId, color });

      return { event: 'joinedGame', data: game };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('setReady')
  async handleSetReady(
    @MessageBody() data: { gameId: string; userId: string; isReady: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, userId, isReady } = data;
      const game = await this.gameService.setPlayerReady(
        gameId,
        userId,
        isReady,
      );

      const room = `game:${gameId}`;
      this.server.to(room).emit('gameStateUpdated', game);
      this.server.to(room).emit('playerReadyChanged', { userId, isReady });

      // If the game has started, notify all players
      if (game.status === 'PLAYING') {
        this.server.to(room).emit('gameStarted', {
          currentTurn: game.currentTurn,
          message: 'Game has started!',
        });
      }

      return { event: 'readyStatusSet', data: { isReady } };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('rollDice')
  async handleRollDice(
    @MessageBody() data: RollDiceDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, playerId } = data;
      const result = await this.gameService.rollDice({ gameId, playerId });

      const room = `game:${gameId}`;
      this.server.to(room).emit('gameStateUpdated', result.game);
      this.server.to(room).emit('diceRolled', {
        playerId,
        diceValue: result.diceValue,
      });

      return { event: 'diceRolled', data: result };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('movePiece')
  async handleMovePiece(
    @MessageBody() data: MovePieceDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, playerId, pieceId, diceValue } = data;
      const game = await this.gameService.movePiece({
        gameId,
        playerId,
        pieceId,
        diceValue,
      });

      const room = `game:${gameId}`;
      this.server.to(room).emit('gameStateUpdated', game);
      this.server.to(room).emit('pieceMoved', {
        playerId,
        pieceId,
        diceValue,
      });

      // Check if game is finished
      if (game.status === 'FINISHED') {
        this.server.to(room).emit('gameEnded', {
          winner: game.winner,
          message: `Player ${game.winner} has won the game!`,
        });
      }

      return { event: 'pieceMoved', data: game };
    } catch (error) {
      return { event: 'error', data: { message: error.message } };
    }
  }
}
