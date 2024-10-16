import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lobby } from './lobby.entity';
import { User } from '../users/user.entity';

@Injectable()
export class LobbyService {
  constructor(
    @InjectRepository(Lobby)
    private lobbyRepository: Repository<Lobby>,
  ) {}

  createLobby(name: string, creator: User): Promise<Lobby> {
    const lobby = this.lobbyRepository.create({
      name,
      creator,
      participants: [creator.id],
    });

    return this.lobbyRepository.save(lobby);
  }

  findAll(): Promise<Lobby[]> {
    return this.lobbyRepository.find({ relations: ['creator'] });
  }

  findOne(id: string): Promise<Lobby | undefined> {
    return this.lobbyRepository.findOne(id);
  }

  async joinLobby(lobbyId: string, userId: string): Promise<Lobby> {
    const lobby = await this.lobbyRepository.findOne(lobbyId);

    if (!lobby.participants.includes(userId)) {
      lobby.participants.push(userId);
      await this.lobbyRepository.save(lobby);
    }

    return lobby;
  }
}
