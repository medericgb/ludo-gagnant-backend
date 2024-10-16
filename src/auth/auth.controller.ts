import {
  Controller,
  Body,
  Post,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(new ValidationPipe()) input: RegisterUserDto) {
    const user = await this.authService.register(input);
    if (!user) {
      throw new HttpException(
        'Failed to register user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: 'User registered', userId: user.id };
  }

  @Post('login')
  async login(@Body(new ValidationPipe()) input: LoginUserDto) {
    const user = await this.authService.validateUser(input.username, input.password);
    if (!user) {
      throw new HttpException(
        'Failed to login user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.authService.login(user);
  }

}
