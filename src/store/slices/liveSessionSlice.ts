// src/store/slices/liveSessionSlice.ts (Updated for Round Management)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LiveSession, Game, PlayerStats, GameAssignment } from '../../types';
import { Alert } from '../../utils/alert';

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

const liveSessionSlice = createSlice({
  name: 'liveSession',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<LiveSession>) => {
      state.currentSession = action.payload;
    },
    generateNextRound: (state, action: PayloadAction<{ assignments: GameAssignment[] }>) => {
      if (!state.currentSession) return;

      const newGames: Game[] = action.payload.assignments.map((assignment, index) => ({
        id: `game_${state.currentSession!.currentGameNumber}_${assignment.court.id}_${Date.now()}_${index}`,
        sessionId: state.currentSession!.sessionId,
        gameNumber: state.currentSession!.currentGameNumber,
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

      state.currentSession.activeGames = newGames;
    },
    startRound: (state) => {
      if (!state.currentSession) return;

      const now = new Date().toISOString();

      // Mark all games in the round as started
      state.currentSession.activeGames.forEach(game => {
        game.startedAt = now;
      });
    },
    completeRound: (state, action: PayloadAction<{
      scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }
    }>) => {
      if (!state.currentSession) return;

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
    // updateRoundScores: (state, action: PayloadAction<{
    //   scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }
    // }>) => {
    //   if (!state.currentSession) return;

    //   // Update scores for completed round
    //   state.currentSession.activeGames.forEach(game => {
    //     const score = action.payload.scores[game.id];
    //     if (score) {
    //       game.score = score;
    //     }
    //   });
    // },
    updatePlayerStats: (state, action: PayloadAction<PlayerStats[]>) => {
      if (!state.currentSession) return;
      console.log(`updatePlayerStats: ${action.payload}`);
      state.currentSession.playerStats = action.payload;
    },
    endLiveSession: (state) => {
      state.currentSession = null;
    },
    // Keep for backward compatibility but not used in round mode
    // completeGame: (state, action: PayloadAction<{
    //   gameId: string;
    //   score?: { serveScore: number; receiveScore: number }
    // }>) => {
    //   if (!state.currentSession) return;

    //   const game = state.currentSession.activeGames.find(g => g.id === action.payload.gameId);
    //   if (game) {
    //     game.isCompleted = true;
    //     game.completedAt = new Date().toISOString();
    //     if (action.payload.score) {
    //       game.score = action.payload.score;
    //     }
    //   }
    // },
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
  setCurrentSession,
  generateNextRound,
  startRound,
  completeRound,
  // updateRoundScores,
  updatePlayerStats,
  endLiveSession,
  // completeGame, // Legacy - for compatibility
  updateGameScore,
  setLoading,
  setError,
} = liveSessionSlice.actions;

export default liveSessionSlice.reducer;
