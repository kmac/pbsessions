import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Player } from '@/src/types/index';

interface PlayersState {
  players: Player[];
  loading: boolean;
  error: string | null;
}

const initialState: PlayersState = {
  players: [],
  loading: false,
  error: null,
};

const playersSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = new Date().toISOString();
      const newPlayer: Player = {
        ...action.payload,
        id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        createdAt: now,
        updatedAt: now,
      };
      state.players.push(newPlayer);
    },
    updatePlayer: (state, action: PayloadAction<Player>) => {
      const index = state.players.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.players[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter(p => p.id !== action.payload);
    },
    addMultiplePlayers: (state, action: PayloadAction<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[]>) => {
      const now = new Date().toISOString();
      const newPlayers = action.payload.map((player, index) => ({
        ...player,
        id: `player_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 11)}`,
        createdAt: now,
        updatedAt: now,
      }));
      state.players.push(...newPlayers);
    },
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
      state.loading = false;
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
  addPlayer,
  updatePlayer,
  removePlayer,
  addMultiplePlayers,
  setPlayers,
  setLoading,
  setError,
} = playersSlice.actions;

export default playersSlice.reducer;
