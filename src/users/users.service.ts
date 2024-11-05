import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async findUniqueUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.prisma.user.findUnique({ where });
    if (!user) {
      const field = Object.keys(where)[0];
      throw new NotFoundException(`User with ${field} ${where[field]} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.findUniqueUser({ username });
  }

  async findByEmail(email: string): Promise<User> {
    return this.findUniqueUser({ email });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User> {
    return this.findUniqueUser({ phoneNumber });
  }

  async findById(id: string): Promise<User> {
    return this.findUniqueUser({ id });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw error;
    }
  }

  async checkUserExists(
    username: string,
    email: string,
    phoneNumber: string
  ): Promise<{ exists: boolean; field?: string }> {
    const fields = ['username', 'email', 'phoneNumber'] as const;
    for (const field of fields) {
      // @ts-ignore
      const user = await this.prisma.user.findUnique({ where: { [field]: eval(field) } });
      if (user) return { exists: true, field };
    }
    return { exists: false };
  }
}
