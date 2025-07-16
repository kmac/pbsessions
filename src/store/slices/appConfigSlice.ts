import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Setting } from '@/src/types';

interface AppConfigState {
  appConfig: Setting;
  loading: boolean;
  error: string | null;
}

const initialState: AppConfigState = {
  appConfig: { color: 'default', theme: 'light' },
  loading: false,
  error: null,
};

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    setAppConfig: (state, action: PayloadAction<Setting>) => {
      state.appConfig = action.payload;
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
  setAppConfig,
  setLoading,
  setError,
} = appConfigSlice.actions;

export default appConfigSlice.reducer;
