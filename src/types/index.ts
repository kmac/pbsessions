import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";
import Colors from "@/src/ui/styles/colors";

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: "male" | "female";
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

export interface FixedPartnership {
  id: string;
  player1Id: string;
  player2Id: string;
  // Optional descriptive name
  name?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PartnershipConstraint {
  partnerships: FixedPartnership[];
  // If true, both players in a partnership must play or both sit out
  // There is global Settings defaultEnforceFixedPartnerships
  enforceAllPairings: boolean;
}

export interface Session {
  id: string;
  name: string;
  dateTime: string;
  playerIds: string[];
  pausedPlayerIds?: string[];
  courts: Court[];
  state: SessionState;
  scoring: boolean;
  showRatings: boolean;
  partnershipConstraint?: PartnershipConstraint;
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
  consecutiveGames: number;
  partners: { [playerId: string]: number }; // count of games played with each partner
  fixedPartnershipGames: number; // games played with fixed partner
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
  defaultEnforceFixedPartnerships: boolean;
}
