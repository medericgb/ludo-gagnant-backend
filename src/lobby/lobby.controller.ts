import {
  Body,
  Param,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateLobbyDto } from './dto/create-lobby.dto';
import { KickParticipantDto } from './dto/kick-participant.dto';

@Controller('lobby')
@UseGuards(JwtAuthGuard)
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @Post('create')
  createLobby(
    @Body(ValidationPipe) createLobbyDto: CreateLobbyDto,
    @Req() req,
  ) {
    return this.lobbyService.createLobby(createLobbyDto, req.user.userId);
  }

  @Post(':id/join')
  joinLobby(@Param('id') id: string, @Req() req) {
    return this.lobbyService.joinLobby(id, req.user.userId);
  }

  @Get()
  findAll() {
    return this.lobbyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lobbyService.findOne(id);
  }

  @Post(':id/leave')
  leaveLobby(@Param('id') id: string, @Req() req) {
    return this.lobbyService.leaveLobby(id, req.user.userId);
  }

  @Post(':id/kick')
  kickParticipant(
    @Param('id') id: string,
    @Body(ValidationPipe) kickParticipant: KickParticipantDto,
    @Req() req,
  ) {
    const { participantId } = kickParticipant;
    return this.lobbyService.kickParticipant(
      id,
      req.user.userId,
      participantId,
    );
  }

  @Delete(':id')
  deleteLobby(@Param('id') id: string, @Req() req) {
    return this.lobbyService.deleteLobby(id, req.user.userId);
  }
}
