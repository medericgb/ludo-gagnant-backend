import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('lobby')
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() body, @Req() req) {
    return this.lobbyService.createLobby(body.name, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Body() body, @Req() req) {
    return this.lobbyService.joinLobby(body.lobbyId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.lobbyService.findAll();
  }
}
