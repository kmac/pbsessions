// src/store/slices/groupsSlice.ts (Complete version with missing actions)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group } from '../../types';

interface GroupsState {
  groups: Group[];
  loading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  groups: [],
  loading: false,
  error: null,
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    addGroup: (state, action: PayloadAction<Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = new Date().toISOString();
      const newGroup: Group = {
        ...action.payload,
        id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        createdAt: now,
        updatedAt: now,
      };
      state.groups.push(newGroup);
    },
    updateGroup: (state, action: PayloadAction<Group>) => {
      const index = state.groups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(g => g.id !== action.payload);
    },
    addPlayerToGroup: (state, action: PayloadAction<{ groupId: string; playerId: string }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group && !group.playerIds.includes(action.payload.playerId)) {
        group.playerIds.push(action.payload.playerId);
        group.updatedAt = new Date().toISOString();
      }
    },
    removePlayerFromGroup: (state, action: PayloadAction<{ groupId: string; playerId: string }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group) {
        group.playerIds = group.playerIds.filter(id => id !== action.payload.playerId);
        group.updatedAt = new Date().toISOString();
      }
    },
    setGroups: (state, action: PayloadAction<Group[]>) => {
      state.groups = action.payload;
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
  addGroup,
  updateGroup,
  removeGroup,
  addPlayerToGroup,
  removePlayerFromGroup,
  setGroups,
  setLoading,
  setError,
} = groupsSlice.actions;

export default groupsSlice.reducer;

