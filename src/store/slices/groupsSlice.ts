import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group } from '@/src/types';

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
  // extraReducers: (builder) => {
  //   builder.addCase(removePlayer, (state, action: PayloadAction<string> ) => {
  //     const removedPlayerId = action.payload;
  //   });
  // },

});

export const {
  addGroup,
  updateGroup,
  removeGroup,
  setGroups,
  setLoading,
  setError,
} = groupsSlice.actions;

export default groupsSlice.reducer;
