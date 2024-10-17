import { HttpException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

export interface RegisterInput {
  readonly username: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(input: RegisterInput) {
    const exist = await this.usersService.findOneByUsername(input.username) ||
      await this.usersService.findOneByEmail(input.email) ||
      await this.usersService.findOneByPhoneNumber(input.phoneNumber);

    if (exist) {
      throw new HttpException('Username, email or phone number already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const { password, ...user } = await this.usersService.create({
      ...input,
      password: hashedPassword,
    });

    return user;
  }
}
