import { Lobby } from './lobby.interface';

export interface LobbyWithCreator extends Lobby {
  creator: {
    id: string;
    username: string;
  };
}
