import {
  Controller,
  Body,
  Post,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(ValidationPipe) input: RegisterUserDto) {
    try {
      const user = await this.authService.register(input);
      return { message: 'User registered successfully', userId: user.id };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body(ValidationPipe) input: LoginUserDto) {
    const user = await this.authService.validateUser(input.username, input.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }
}
