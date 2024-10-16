import { IsString, IsStrongPassword } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
