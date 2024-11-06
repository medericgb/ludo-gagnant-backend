import { IsNotEmpty, IsString } from 'class-validator';

export class KickParticipantDto {
  @IsNotEmpty()
  @IsString()
  participantId: string;
}
