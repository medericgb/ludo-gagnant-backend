import { Body, Param, Controller, Post, Get, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateLobbyDto } from './dto/create-lobby.dto';

@Controller('lobby')
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  createLobby(@Body(ValidationPipe) createLobbyDto: CreateLobbyDto, @Req() req) {
    return this.lobbyService.createLobby(createLobbyDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinLobby(@Param('id') id: string, @Req() req) {
    return this.lobbyService.joinLobby(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.lobbyService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lobbyService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  leaveLobby(@Param('id') id: string, @Req() req) {
    return this.lobbyService.leaveLobby(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/kick')
  kickParticipant(@Param('id') id: string, @Req() req) {
    return this.lobbyService.kickParticipant(id, req.user.userId);
  }
}
