import { IsString, IsNotEmpty } from 'class-validator';

export class RollDiceDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  playerId: string;
}
