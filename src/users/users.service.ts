import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findOneByUsername(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(userInput: {
    username: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<User> {
    const user = this.usersRepository.create(userInput);
    return this.usersRepository.save(user);
  }
}
