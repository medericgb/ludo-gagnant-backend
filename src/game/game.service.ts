import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Game } from './interfaces/game.interface';
import { Prisma } from '@prisma/client';
import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { MovePieceDto } from './dto/move-piece.dto';
import { RollDiceDto } from './dto/roll-dice.dto';
import { PiecePositions } from './interfaces/game-player.interface';

// Since enums might not be exported by Prisma client, define them here
enum GameStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

enum PlayerColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE',
}

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  // Game creation and management
  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    const { lobbyId } = createGameDto;

    // Check if lobby exists
    const lobby = await this.prisma.lobby.findUnique({
      where: { id: lobbyId },
    });

    if (!lobby) {
      throw new NotFoundException(`Lobby with ID ${lobbyId} not found`);
    }

    // Check if lobby already has a game
    const existingGame = await this.prisma.$queryRaw`
      SELECT id FROM "Game" WHERE "lobbyId" = ${lobbyId}
    `;

    if (existingGame && existingGame.length > 0) {
      throw new ConflictException(
        `Lobby already has a game with ID ${existingGame[0].id}`,
      );
    }

    // Create the game
    const game = await this.prisma.$transaction(async (prisma) => {
      return prisma.game.create({
        data: {
          status: GameStatus.WAITING,
          lobbyId,
        },
        include: {
          players: true,
          moves: true,
          diceRolls: true,
        },
      });
    });

    return game;
  }

  async findGameById(id: string): Promise<Game> {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        players: true,
        moves: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        diceRolls: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return game;
  }

  async findGameByLobbyId(lobbyId: string): Promise<Game> {
    const game = await this.prisma.game.findFirst({
      where: { lobbyId },
      include: {
        players: true,
        moves: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        diceRolls: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!game) {
      throw new NotFoundException(
        `Game for lobby with ID ${lobbyId} not found`,
      );
    }

    return game;
  }

  // Player management
  async joinGame(joinGameDto: JoinGameDto): Promise<Game> {
    const { gameId, userId, color } = joinGameDto;

    // Check if game exists and get player count
    const game = await this.findGameById(gameId);

    // Make sure the game is in WAITING status
    if (game.status !== GameStatus.WAITING) {
      throw new ConflictException(`Game is already in progress or finished`);
    }

    // Check if the player is already in the game
    const existingPlayer = game.players.find(
      (player) => player.userId === userId,
    );
    if (existingPlayer) {
      throw new ConflictException(`Player is already in the game`);
    }

    // Check if the color is already taken
    const colorTaken = game.players.some((player) => player.color === color);
    if (colorTaken) {
      throw new ConflictException(`Color ${color} is already taken`);
    }

    // Check if the game is full (4 players max)
    if (game.players.length >= 4) {
      throw new ConflictException(`Game is full`);
    }

    // Add the player to the game
    const initialPosition: PiecePositions = {
      0: -1, // -1 represents that the piece is in the home position
      1: -1,
      2: -1,
      3: -1,
    };

    await this.prisma.gamePlayer.create({
      data: {
        gameId,
        userId,
        color,
        position: initialPosition,
        isReady: false,
      },
    });

    // Return the updated game
    return this.findGameById(gameId);
  }

  async setPlayerReady(
    gameId: string,
    userId: string,
    isReady: boolean,
  ): Promise<Game> {
    // Find the player
    const player = await this.prisma.gamePlayer.findFirst({
      where: {
        gameId,
        userId,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player not found in game ${gameId}`);
    }

    // Update player readiness
    await this.prisma.gamePlayer.update({
      where: { id: player.id },
      data: { isReady },
    });

    // Check if all players are ready and there are at least 2 players
    const game = await this.findGameById(gameId);

    if (
      game.status === GameStatus.WAITING &&
      game.players.length >= 2 &&
      game.players.every((p) => p.isReady)
    ) {
      // Start the game by setting the first player's turn
      const sortedPlayers = [...game.players].sort((a, b) => {
        // Order: RED, GREEN, YELLOW, BLUE
        return a.color.localeCompare(b.color);
      });

      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          status: GameStatus.PLAYING,
          currentTurn: sortedPlayers[0].userId,
        },
      });
    }

    return this.findGameById(gameId);
  }

  // Game actions
  async rollDice(
    rollDiceDto: RollDiceDto,
  ): Promise<{ game: Game; diceValue: number }> {
    const { gameId, playerId } = rollDiceDto;

    // Check if game exists and is in PLAYING state
    const game = await this.findGameById(gameId);

    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException('Game is not in playing state');
    }

    // Check if it's the player's turn
    if (game.currentTurn !== playerId) {
      throw new BadRequestException(`It's not your turn`);
    }

    // Generate a random dice roll (1-6)
    const diceValue = Math.floor(Math.random() * 6) + 1;

    // Save the dice roll
    await this.prisma.diceRoll.create({
      data: {
        gameId,
        playerId,
        value: diceValue,
      },
    });

    // Return the updated game and dice value
    return {
      game: await this.findGameById(gameId),
      diceValue,
    };
  }

  async movePiece(movePieceDto: MovePieceDto): Promise<Game> {
    const { gameId, playerId, pieceId, diceValue } = movePieceDto;

    // Check if game exists and is in PLAYING state
    const game = await this.findGameById(gameId);

    if (game.status !== GameStatus.PLAYING) {
      throw new BadRequestException('Game is not in playing state');
    }

    // Check if it's the player's turn
    if (game.currentTurn !== playerId) {
      throw new BadRequestException(`It's not your turn`);
    }

    // Get the player
    const player = game.players.find((p) => p.userId === playerId);
    if (!player) {
      throw new NotFoundException(`Player not found in game ${gameId}`);
    }

    // Get the current position of the piece
    const currentPosition = player.position[pieceId];
    if (currentPosition === undefined) {
      throw new BadRequestException(`Invalid piece ID: ${pieceId}`);
    }

    // Calculate the new position
    let newPosition: number;

    // Check if piece is in home (-1) and the player rolled a 6
    if (currentPosition === -1) {
      if (diceValue !== 6) {
        throw new BadRequestException(
          'Need to roll a 6 to move a piece out of home',
        );
      }
      // Piece exits home - set to starting position based on color
      newPosition = this.getStartingPosition(player.color);
    } else {
      // Piece is already on the board - move it forward
      newPosition = this.calculateNewPosition(
        currentPosition,
        diceValue,
        player.color,
      );
    }

    // Check for collisions with other players' pieces
    const collision = await this.checkForCollision(game, player, newPosition);

    // Update the piece position
    const updatedPosition = { ...player.position };
    updatedPosition[pieceId] = newPosition;

    await this.prisma.gamePlayer.update({
      where: { id: player.id },
      data: { position: updatedPosition },
    });

    // Record the move
    await this.prisma.gameMove.create({
      data: {
        gameId,
        playerId,
        pieceId,
        fromPos: currentPosition,
        toPos: newPosition,
      },
    });

    // Handle collision if there is one
    if (collision) {
      const { collisionPlayer, collisionPieceId } = collision;
      const collisionPosition = { ...collisionPlayer.position };
      collisionPosition[collisionPieceId] = -1; // Send back to home

      await this.prisma.gamePlayer.update({
        where: { id: collisionPlayer.id },
        data: { position: collisionPosition },
      });
    }

    // Check if the player has won (all pieces in finish zone)
    const hasWon = this.checkForWin(updatedPosition, player.color);
    if (hasWon) {
      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          status: GameStatus.FINISHED,
          winner: playerId,
        },
      });
      return this.findGameById(gameId);
    }

    // Move to the next player's turn if not rolling a 6
    if (diceValue !== 6) {
      const nextPlayer = this.getNextPlayer(game, playerId);
      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          currentTurn: nextPlayer.userId,
        },
      });
    }

    // Return the updated game
    return this.findGameById(gameId);
  }

  // Helper methods for game logic
  private getStartingPosition(color: PlayerColor): number {
    // Define starting positions for each color
    const startPositions = {
      [PlayerColor.RED]: 0,
      [PlayerColor.GREEN]: 13,
      [PlayerColor.YELLOW]: 26,
      [PlayerColor.BLUE]: 39,
    };

    return startPositions[color];
  }

  private calculateNewPosition(
    currentPos: number,
    diceValue: number,
    color: PlayerColor,
  ): number {
    // The board has 52 positions (0-51) excluding home and finish zones
    const newPos = (currentPos + diceValue) % 52;

    // Check if the piece should enter its finish zone
    const finishEntrance = {
      [PlayerColor.RED]: 50,
      [PlayerColor.GREEN]: 11,
      [PlayerColor.YELLOW]: 24,
      [PlayerColor.BLUE]: 37,
    };

    if (currentPos <= finishEntrance[color] && newPos > finishEntrance[color]) {
      // Calculate finish zone position (100+ for finish zone)
      return 100 + (newPos - finishEntrance[color] - 1);
    }

    return newPos;
  }

  private async checkForCollision(
    game: Game,
    player: any,
    newPosition: number,
  ): Promise<{ collisionPlayer: any; collisionPieceId: number } | null> {
    // No collisions in home or finish zones
    if (newPosition < 0 || newPosition >= 100) {
      return null;
    }

    for (const otherPlayer of game.players) {
      // Skip the current player
      if (otherPlayer.id === player.id) continue;

      // Check each piece of the other player
      for (let pieceId = 0; pieceId < 4; pieceId++) {
        if (otherPlayer.position[pieceId] === newPosition) {
          return {
            collisionPlayer: otherPlayer,
            collisionPieceId: pieceId,
          };
        }
      }
    }

    return null;
  }

  private checkForWin(positions: PiecePositions, color: PlayerColor): boolean {
    // Check if all pieces are in the finish zone
    return Object.values(positions).every((pos) => pos >= 100 && pos <= 105);
  }

  private getNextPlayer(game: Game, currentPlayerId: string): any {
    // Order players by color: RED, GREEN, YELLOW, BLUE
    const sortedPlayers = [...game.players].sort((a, b) => {
      return a.color.localeCompare(b.color);
    });

    // Find the index of the current player
    const currentIndex = sortedPlayers.findIndex(
      (p) => p.userId === currentPlayerId,
    );

    // Get the next player (wrap around to the first player if at the end)
    return sortedPlayers[(currentIndex + 1) % sortedPlayers.length];
  }
}
