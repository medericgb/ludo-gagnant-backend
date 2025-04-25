export interface DiceRoll {
  id: string;
  gameId: string;
  playerId: string;
  value: number; // 1-6
  createdAt: Date;
}
