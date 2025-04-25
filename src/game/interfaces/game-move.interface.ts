export interface GameMove {
  id: string;
  gameId: string;
  playerId: string;
  pieceId: number; // 0-3 for the four pieces
  fromPos: number;
  toPos: number;
  createdAt: Date;
}
