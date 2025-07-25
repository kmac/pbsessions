import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LiveSession, Court, Game, PlayerStats, GameAssignment } from '@/src/types';
// import { Alert } from '@/src/utils/alert';

interface LiveSessionState {
  currentSession: LiveSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: LiveSessionState = {
  currentSession: null,
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
    setCurrentSession: (state, action: PayloadAction<LiveSession>) => {
      state.currentSession = action.payload;
    },
    updateCourts: (state, action: PayloadAction<Court[]>) => {
      if (!state.currentSession) {
        return;
      }
      state.currentSession.courts = action.payload;
    },
    updateCurrentSessionGames: (state, action: PayloadAction<Game[]>) => {
      if (!state.currentSession) {
        return;
      }
      // replace the activeGames array with the new games
      state.currentSession.activeGames = action.payload;
    },
    generateNextRound: (state, action: PayloadAction<{ assignments: GameAssignment[] }>) => {
      if (!state.currentSession) {
        return;
      }
      const newGames: Game[] = convertAssignmentsToGames(state.currentSession, action.payload.assignments);
      state.currentSession.activeGames = newGames;
    },
    startRound: (state) => {
      if (!state.currentSession) {
        return;
      }
      const now = new Date().toISOString();

      // Mark all games in the round as started
      state.currentSession.activeGames.forEach(game => {
        game.startedAt = now;
      });
    },
    completeRound: (state, action: PayloadAction<{
      scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }
    }>) => {
      if (!state.currentSession) {
        return;
      }
      const now = new Date().toISOString();

      // Mark all games as completed and apply scores
      state.currentSession.activeGames.forEach(game => {
        game.isCompleted = true;
        game.completedAt = now;

        const score = action.payload.scores[game.id];
        if (score) {
          game.score = score;
        }
      });

      // Increment the round number for the next round
      state.currentSession.currentGameNumber += 1;
    },
    updatePlayerStats: (state, action: PayloadAction<PlayerStats[]>) => {
      if (!state.currentSession) return;
      console.log(`updatePlayerStats: ${action.payload}`);
      state.currentSession.playerStats = action.payload;
    },
    endLiveSession: (state) => {
      state.currentSession = null;
    },
    updateGameScore: (state, action: PayloadAction<{
      gameId: string;
      score: { serveScore: number; receiveScore: number }
    }>) => {
      if (!state.currentSession) return;

      const game = state.currentSession.activeGames.find(g => g.id === action.payload.gameId);
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
  setCurrentSession,
  setError,
  setLoading,
  startRound,
  updateCurrentSessionGames,
  updateCourts,
  updateGameScore,
  updatePlayerStats,
} = liveSessionSlice.actions;

export default liveSessionSlice.reducer;
