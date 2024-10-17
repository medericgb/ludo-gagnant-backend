import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Lobby } from './lobby.interface';

@Injectable()
export class LobbyService {
  constructor(private prisma: PrismaService) {}

  async createLobby(name: string, creatorId: string): Promise<Lobby> {
    return this.prisma.lobby.create({
      data: {
        name,
        creatorId,
        participants: [creatorId],
      },
    });
  }

  async findAll() {
    return await this.prisma.lobby.findMany({
      select: {
        id: true,
        name: true,
        creator: {
          select: {
            username: true,
          },
        },
        participants: true,
      },
    });
  }

  async findOne(id: string) {
    const lobby = await this.prisma.lobby.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        creator: {
          select: {
            username: true,
          },
        },
        participants: true,
      },
    });

    if (!lobby) {
      throw new HttpException('Lobby not found', 404);
    }

    return lobby;
  }

  async joinLobby(lobbyId: string, userId: string) {
    const lobby = await this.findOne(lobbyId);

    if (lobby.participants.length < 4 && !lobby.participants.includes(userId)) {
      lobby.participants.push(userId);

      return this.prisma.lobby.update({
        where: {
          id: lobbyId,
        },
        select: {
          name: true,
          creator: {
            select: {
              username: true,
            },
          },
          participants: true,
        },
        data: {
          participants: lobby.participants,
        },
      });
    }

    return lobby;
  }
}
