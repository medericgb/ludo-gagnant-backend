import { GameStatus } from '@prisma/client';
import { GamePlayer } from './game-player.interface';
import { GameMove } from './game-move.interface';
import { DiceRoll } from './dice-roll.interface';

export interface Game {
  id: string;
  status: GameStatus;
  currentTurn?: string;
  winner?: string;
  lobbyId: string;
  players?: GamePlayer[];
  moves?: GameMove[];
  diceRolls?: DiceRoll[];
  createdAt: Date;
  updatedAt: Date;
}
