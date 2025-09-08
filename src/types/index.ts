import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";
import Colors from "@/src/ui/styles/colors";

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  rating?: number; // DUPR-style rating
  notes?: string;
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
  name: string;
  minimumRating?: number;
  isActive: boolean;
}

export const createCourt = (
  name: string,
  minimumRating: number | undefined = undefined,
  isActive = true,
): Court => {
  return {
    id: uuidv4(),
    name: name,
    minimumRating: minimumRating,
    isActive: isActive ? isActive : true,
  };
};

export enum SessionState {
  New = "New",
  Live = "Live",
  Complete = "Complete",
  Archived = "Archived",
}

export interface Session {
  id: string;
  name: string;
  dateTime: string;
  playerIds: string[];
  courts: Court[];
  state: SessionState;
  scoring: boolean;
  showRatings: boolean;
  createdAt: string;
  updatedAt: string;
  liveData?: {
    rounds: Round[];
    playerStats: PlayerStats[];
  };
}

export interface Score {
  serveScore: number;
  receiveScore: number;
}

export interface Team {
  player1Id: string;
  player2Id: string;
}

export interface Game {
  id: string;
  sessionId: string;
  gameNumber: number;
  courtId: string;
  serveTeam: Team;
  receiveTeam: Team;
  isCompleted: boolean;
  score?: Score;
  startedAt?: string;
  completedAt?: string;
}

export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  gamesSatOut: number;
  partners: { [playerId: string]: number }; // count of games played with each partner
  totalScore: number;
  totalScoreAgainst: number;
  averageRating?: number;
}

export interface Results {
  scores: { [gameId: string]: Score | null };
}

export interface Round {
  games: Game[];
  sittingOutIds: string[];
}

export type GameAssignment = Pick<
  Game,
  "courtId" | "serveTeam" | "receiveTeam"
>;

export interface RoundAssignment {
  roundNumber: number;
  gameAssignments: GameAssignment[];
  sittingOutIds: string[];
}

// TODO this should go away with full theme support?:
export type Color = keyof typeof Colors.light;

export interface Settings {
  color: Color;
  theme: "light" | "dark" | "auto";
  defaultUseScoring: boolean;
  defaultUseRatings: boolean;
}
