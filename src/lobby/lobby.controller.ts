import { Body, Param, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('lobby')
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  createLobby(@Body() body, @Req() req) {
    return this.lobbyService.createLobby(body.name, req.user.userId);
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
}
