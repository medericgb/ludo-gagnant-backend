import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class MovePieceDto {
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsNumber()
  @Min(0)
  @Max(3)
  pieceId: number;

  @IsNumber()
  diceValue: number;
}
