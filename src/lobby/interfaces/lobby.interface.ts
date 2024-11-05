export interface Lobby {
  id: string;
  name: string;
  creatorId: string;
  participants: string[];
  maxParticipants: 2 | 4;
}

interface LobbyWithCreator extends Lobby {
  creator: {
    id: string;
    username: string;
  };
}

export type LobbyType = Lobby | LobbyWithCreator;