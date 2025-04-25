import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { PlayerColor } from '@prisma/client';

export class JoinGameDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(PlayerColor)
  color: PlayerColor;
}
