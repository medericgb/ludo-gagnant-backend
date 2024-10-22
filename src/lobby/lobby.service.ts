import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Lobby } from './interfaces/lobby.interface';
import { LobbyWithCreator } from './interfaces/lobby-with-creator.interface';
import { CreateLobbyDto } from './dto/create-lobby.dto';

@Injectable()
export class LobbyService {
  constructor(private prisma: PrismaService) {}

  async createLobby(
    createLobbyDto: CreateLobbyDto,
    creatorId: string,
  ): Promise<Lobby> {
    const { name, maxParticipants } = createLobbyDto;

    if (maxParticipants !== 2 && maxParticipants !== 4) {
      throw new HttpException(
        'Max participants must be 2 or 4',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // @ts-ignore
      return await this.prisma.lobby.create({
        data: {
          name,
          creatorId,
          participants: [creatorId],
          maxParticipants,
        },
        select: this.getLobbySelect(),
      });
    } catch (error) {
      throw new HttpException(
        'Failed to create lobby',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<LobbyWithCreator[]> {
    return this.prisma.lobby.findMany({
      select: {
        ...this.getLobbySelect(),
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<LobbyWithCreator> {
    const lobby = await this.prisma.lobby.findUnique({
      where: { id },
      select: this.getLobbySelect(),
    });

    if (!lobby) {
      throw new HttpException('Lobby not found', HttpStatus.NOT_FOUND);
    }

    return lobby;
  }

  async joinLobby(lobbyId: string, userId: string): Promise<Lobby> {
    const lobby = await this.findOne(lobbyId);

    if (lobby.participants.length >= lobby.maxParticipants) {
      throw new HttpException('Lobby is full', HttpStatus.CONFLICT);
    }

    if (lobby.participants.includes(userId)) {
      throw new HttpException(
        'User is already in the lobby',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.lobby.update({
      where: { id: lobbyId },
      data: {
        participants: {
          push: userId,
        },
      },
      select: this.getLobbySelect(),
    });
  }

  async deleteLobby(lobbyId: string, userId: string): Promise<any> {
    const lobby = await this.findLobbyWithCreator(lobbyId);

    if (lobby.creator.id !== userId) {
      throw new HttpException(
        'Only the creator can delete the lobby',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.prisma.lobby.delete({
      where: { id: lobbyId },
      select: this.getLobbySelect(),
    });
  }

  async leaveLobby(lobbyId: string, userId: string): Promise<Lobby> {
    const lobby = await this.findLobbyWithCreator(lobbyId);

    if (!lobby.participants.includes(userId)) {
      throw new HttpException('User is not in the lobby', HttpStatus.CONFLICT);
    }

    if (lobby.creator.id === userId) {
      throw new HttpException(
        'Creator cannot leave the lobby',
        HttpStatus.CONFLICT,
      );
    }

    return this.updateLobbyParticipants(
      lobbyId,
      lobby.participants.filter((id) => id !== userId),
    );
  }

  async kickParticipant(
    lobbyId: string,
    userId: string,
    participantId: string,
  ): Promise<Lobby> {
    const lobby = await this.findLobbyWithCreator(lobbyId);

    if (lobby.creator.id !== userId) {
      throw new HttpException(
        'Only the creator can kick participants',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!lobby.participants.includes(participantId)) {
      throw new HttpException(
        'Participant not in the lobby',
        HttpStatus.CONFLICT,
      );
    }

    if (participantId === userId) {
      throw new HttpException('Cannot kick yourself', HttpStatus.CONFLICT);
    }

    return this.updateLobbyParticipants(
      lobbyId,
      lobby.participants.filter((id) => id !== participantId),
    );
  }

  private getLobbySelect() {
    return {
      id: true,
      name: true,
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      participants: true,
      maxParticipants: true,
    };
  }

  private async findLobbyWithCreator(
    lobbyId: string,
  ): Promise<Lobby & { creator: { id: string } }> {
    const lobby = await this.prisma.lobby.findUnique({
      where: { id: lobbyId },
      select: {
        ...this.getLobbySelect(),
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!lobby) {
      throw new HttpException('Lobby not found', HttpStatus.NOT_FOUND);
    }

    return lobby;
  }

  private async updateLobbyParticipants(
    lobbyId: string,
    participants: string[],
  ): Promise<Lobby> {
    return this.prisma.lobby.update({
      where: { id: lobbyId },
      data: {
        participants: {
          set: participants,
        },
      },
      select: this.getLobbySelect(),
    });
  }
}
