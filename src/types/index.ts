import Colors from '@/src/ui/styles/colors'

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  rating?: number; // DUPR-style rating
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  playerIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Court {
  id: string;
  number: number;
  minimumRating?: number;
  isActive: boolean;
}

export enum SessionState {
  Unstarted,
  Live,
  Complete,
  Archived
}

export interface Session {
  id: string;
  name: string;
  dateTime: string;
  playerIds: string[];
  courts: Court[];
  state: SessionState,
  createdAt: string;
  updatedAt: string;
}

export interface LiveSession {
  sessionId: string;
  currentGameNumber: number;
  courts: Court[];
  activeGames: Game[];
  playerStats: PlayerStats[];
  isActive: boolean;
}

export interface Game {
  id: string;
  sessionId: string;
  gameNumber: number;
  courtId: string;
  serveTeam: {
    player1Id: string;
    player2Id: string;
  };
  receiveTeam: {
    player1Id: string;
    player2Id: string;
  };
  sittingOutIds: string[];
  score?: {
    serveScore: number;
    receiveScore: number;
  };
  isCompleted: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  gamesSatOut: number;
  partners: { [playerId: string]: number }; // count of games played with each partner
  totalScore: number;
  averageRating?: number;
}

export interface GameAssignment {
  court: Court;
  serveTeam: [Player, Player];
  receiveTeam: [Player, Player];
  sittingOut: Player[];
}

export type Color = keyof typeof Colors.light

export interface Setting {
  color: Color;
  theme: 'light' | 'dark' | 'auto';
}
