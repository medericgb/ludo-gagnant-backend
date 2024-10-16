import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { User } from './user.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findOneByUsername(username: string): Promise<User | undefined> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findById(id: string): Promise<User | undefined> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
