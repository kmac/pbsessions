import { createSlice } from "@reduxjs/toolkit";

interface AppState {
  isInitialized: boolean;
  isInitializing: boolean;
}

const initialState: AppState = {
  isInitialized: false,
  isInitializing: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    startInitialization: (state) => {
      state.isInitializing = true;
      state.isInitialized = false;
    },
    completeInitialization: (state) => {
      state.isInitializing = false;
      state.isInitialized = true;
    },
  },
});

export const { startInitialization, completeInitialization } = appSlice.actions;
export default appSlice.reducer;
