import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Lobby } from './lobby.interface';

@Injectable()
export class LobbyService {
  constructor(private prisma: PrismaService) {}

  // prisma create lobby
  async createLobby(name: string, creatorId: string): Promise<Lobby> {
    return this.prisma.lobby.create({
      data: {
        name,
        creatorId,
        participants: [creatorId],
      },
    });
  }

  findAll() {
    return this.prisma.lobby.findMany({
      select: {
        id: true,
        name: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.lobby.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        creator: true,
        participants: true,
      },
    });
  }

  async joinLobby(lobbyId: string, userId: string) {
    const lobby = await this.findOne(lobbyId);

    if (lobby.participants.length < 4 && !lobby.participants.includes(userId)) {
      lobby.participants.push(userId);

      return this.prisma.lobby.update({
        where: {
          id: lobbyId,
        },
        data: {
          participants: lobby.participants,
        },
      });
    }

    return lobby;
  }
}
