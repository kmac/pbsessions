import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LiveSession, Court, Game, PlayerStats, GameAssignment } from '@/src/types';
// import { Alert } from '@/src/utils/alert';


// TODO move all of this into SessionNew, and move SessionNew into Session


interface LiveSessionState {
  liveSession: LiveSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: LiveSessionState = {
  liveSession: null,
  loading: false,
  error: null,
};

function convertAssignmentsToGames(liveSession: LiveSession, assignments: GameAssignment[]) {
  const newGames: Game[] = assignments.map((assignment, index) => ({
    id: `game_${liveSession!.currentGameNumber}_${assignment.court.id}_${Date.now()}_${index}`,
    sessionId: liveSession!.sessionId,
    gameNumber: liveSession!.currentGameNumber,
    courtId: assignment.court.id,
    serveTeam: {
      player1Id: assignment.serveTeam[0].id,
      player2Id: assignment.serveTeam[1].id,
    },
    receiveTeam: {
      player1Id: assignment.receiveTeam[0].id,
      player2Id: assignment.receiveTeam[1].id,
    },
    sittingOutIds: assignment.sittingOut.map(p => p.id),
    isCompleted: false,
  }));

  return newGames;
}


const playerStatsToString = (stats: PlayerStats[]): string => {
  if (!stats || stats.length === 0) {
    return "No player statistics available.";
  }
  const lines: string[] = ["=== Player Statistics ==="];
  stats.forEach((pstat, index) => {
    lines.push(`Player ${index + 1}: ${pstat.playerId}`);
    lines.push(`  Games Played: ${pstat.gamesPlayed}`);
    lines.push(`  Games Sat Out: ${pstat.gamesSatOut}`);
    lines.push(`  Total Score: ${pstat.totalScore}`);

    // Show partners and game counts
    const partnerEntries = Object.entries(pstat.partners);
    if (partnerEntries.length > 0) {
      lines.push(`  Partners:`);
      partnerEntries.forEach(([partnerId, gameCount]) => {
        lines.push(`    ${partnerId}: ${gameCount} games`);
      });
    } else {
      lines.push(`  Partners: None`);
    }
  });
  return lines.join("\n");
}

// Note on createSlice:
// A function that accepts an initial state, an object full of reducer
// functions, and a "slice name", and automatically generates action creators
// and action types that correspond to the reducers and state.
//
// Note on reducer:
// Think of a reducer as an event listener which handles events based
// on the received action (event) type.

const liveSessionSlice = createSlice({
  name: 'liveSession',
  initialState,
  reducers: {
    setLiveSession: (state, action: PayloadAction<LiveSession>) => {
      state.liveSession = action.payload;
    },
    updateCourts: (state, action: PayloadAction<Court[]>) => {
      if (!state.liveSession) {
        return;
      }
      state.liveSession.courts = action.payload;
    },
    updateGames: (state, action: PayloadAction<Game[]>) => {
      if (!state.liveSession) {
        return;
      }
      // replace the activeGames array with the new games
      state.liveSession.activeGames = action.payload;
    },
    generateNextRound: (state, action: PayloadAction<{ assignments: GameAssignment[] }>) => {
      if (!state.liveSession) {
        return;
      }
      const newGames: Game[] = convertAssignmentsToGames(state.liveSession, action.payload.assignments);
      state.liveSession.activeGames = newGames;
    },
    startRound: (state) => {
      if (!state.liveSession) {
        return;
      }
      const now = new Date().toISOString();

      // Mark all games in the round as started
      state.liveSession.activeGames.forEach(game => {
        game.startedAt = now;
      });
    },
    completeRound: (state, action: PayloadAction<{
      scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }
    }>) => {
      if (!state.liveSession) {
        return;
      }
      const now = new Date().toISOString();

      // Mark all games as completed and apply scores
      state.liveSession.activeGames.forEach(game => {
        game.isCompleted = true;
        game.completedAt = now;

        const score = action.payload.scores[game.id];
        if (score) {
          game.score = score;
        }
      });

      // Increment the round number for the next round
      state.liveSession.currentGameNumber += 1;
    },
    updatePlayerStats: (state, action: PayloadAction<PlayerStats[]>) => {
      if (!state.liveSession) {
        return;
      }
      console.log(`updatePlayerStats: ${action.payload}`);
      state.liveSession.playerStats = action.payload;
    },
    endLiveSession: (state) => {
      state.liveSession = null;
    },
    updateGameScore: (state, action: PayloadAction<{
      gameId: string;
      score: { serveScore: number; receiveScore: number }
    }>) => {
      if (!state.liveSession) { return };

      const game = state.liveSession.activeGames.find(g => g.id === action.payload.gameId);
      if (game) {
        game.score = action.payload.score;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  completeRound,
  endLiveSession,
  generateNextRound,
  setLiveSession,
  setError,
  setLoading,
  startRound,
  updateGames,
  updateCourts,
  updateGameScore,
  updatePlayerStats,
} = liveSessionSlice.actions;

export default liveSessionSlice.reducer;
