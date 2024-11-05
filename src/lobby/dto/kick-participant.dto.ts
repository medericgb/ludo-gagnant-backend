import { IsNotEmpty, IsString } from 'class-validator';

export class KickParticipantDto {
  @IsNotEmpty()
  @IsString()
  lobbyId: string;

  @IsNotEmpty()
  @IsString()
  participantId: string;
}
