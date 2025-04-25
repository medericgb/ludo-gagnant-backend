import { PlayerColor } from '@prisma/client';

export interface GamePlayer {
  id: string;
  gameId: string;
  userId: string;
  color: PlayerColor;
  position: PiecePositions;
  isReady: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PiecePositions {
  [key: number]: number; // pieceId -> position mapping (0-3 are the piece IDs)
}
