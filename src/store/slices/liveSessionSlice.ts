import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LiveSession, Court, Game, PlayerStats, GameAssignment } from '@/src/types';
// import { Alert } from '@/src/utils/alert';

interface LiveSessionState {
  currentLiveSession: LiveSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: LiveSessionState = {
  currentLiveSession: null,
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
    setLiveSession: (state, action: PayloadAction<LiveSession>) => {
      state.currentLiveSession = action.payload;
    },
    updateCourts: (state, action: PayloadAction<Court[]>) => {
      if (!state.currentLiveSession) {
        return;
      }
      state.currentLiveSession.courts = action.payload;
    },
    updateGames: (state, action: PayloadAction<Game[]>) => {
      if (!state.currentLiveSession) {
        return;
      }
      // replace the activeGames array with the new games
      state.currentLiveSession.activeGames = action.payload;
    },
    generateNextRound: (state, action: PayloadAction<{ assignments: GameAssignment[] }>) => {
      if (!state.currentLiveSession) {
        return;
      }
      const newGames: Game[] = convertAssignmentsToGames(state.currentLiveSession, action.payload.assignments);
      state.currentLiveSession.activeGames = newGames;
    },
    startRound: (state) => {
      if (!state.currentLiveSession) {
        return;
      }
      const now = new Date().toISOString();

      // Mark all games in the round as started
      state.currentLiveSession.activeGames.forEach(game => {
        game.startedAt = now;
      });
    },
    completeRound: (state, action: PayloadAction<{
      scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }
    }>) => {
      if (!state.currentLiveSession) {
        return;
      }
      const now = new Date().toISOString();

      // Mark all games as completed and apply scores
      state.currentLiveSession.activeGames.forEach(game => {
        game.isCompleted = true;
        game.completedAt = now;

        const score = action.payload.scores[game.id];
        if (score) {
          game.score = score;
        }
      });

      // Increment the round number for the next round
      state.currentLiveSession.currentGameNumber += 1;
    },
    updatePlayerStats: (state, action: PayloadAction<PlayerStats[]>) => {
      if (!state.currentLiveSession) return;
      console.log(`updatePlayerStats: ${action.payload}`);
      state.currentLiveSession.playerStats = action.payload;
    },
    endLiveSession: (state) => {
      state.currentLiveSession = null;
    },
    updateGameScore: (state, action: PayloadAction<{
      gameId: string;
      score: { serveScore: number; receiveScore: number }
    }>) => {
      if (!state.currentLiveSession) return;

      const game = state.currentLiveSession.activeGames.find(g => g.id === action.payload.gameId);
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
