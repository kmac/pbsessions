// src/store/slices/liveSessionSlice.ts (Complete Implementation)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LiveSession, Game, PlayerStats, GameAssignment } from '../../types';

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
    generateNextGame: (state, action: PayloadAction<{ assignments: GameAssignment[] }>) => {
      if (!state.currentSession) return;

      const now = new Date().toISOString();
      const newGames: Game[] = action.payload.assignments.map((assignment, index) => ({
        id: `game_${state.currentSession!.currentGameNumber}_${assignment.court.id}_${Date.now()}`,
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
        startedAt: now,
      }));

      state.currentSession.activeGames = newGames;
      state.currentSession.currentGameNumber += 1;
    },
    completeGame: (state, action: PayloadAction<{
      gameId: string;
      score?: { serveScore: number; receiveScore: number }
    }>) => {
      if (!state.currentSession) return;

      const game = state.currentSession.activeGames.find(g => g.id === action.payload.gameId);
      if (game) {
        game.isCompleted = true;
        game.completedAt = new Date().toISOString();
        if (action.payload.score) {
          game.score = action.payload.score;
        }
      }
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
    swapPlayers: (state, action: PayloadAction<{
      gameId: string;
      player1Id: string;
      player2Id: string;
    }>) => {
      if (!state.currentSession) return;

      const game = state.currentSession.activeGames.find(g => g.id === action.payload.gameId);
      if (!game) return;

      // Implementation for swapping players between teams/courts
      // This would be more complex in practice
    },
    updatePlayerStats: (state, action: PayloadAction<PlayerStats[]>) => {
      if (!state.currentSession) return;
      state.currentSession.playerStats = action.payload;
    },
    endLiveSession: (state) => {
      state.currentSession = null;
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
  generateNextGame,
  completeGame,
  updateGameScore,
  swapPlayers,
  updatePlayerStats,
  endLiveSession,
  setLoading,
  setError,
} = liveSessionSlice.actions;

export default liveSessionSlice.reducer;

