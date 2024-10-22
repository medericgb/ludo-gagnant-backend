import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class CreateLobbyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsIn([2, 4])
  maxParticipants: 2 | 4;
}
