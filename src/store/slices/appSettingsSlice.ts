import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Settings } from "@/src/types";

interface AppSettingsState {
  appSettings: Settings;
  loading: boolean;
  error: string | null;
}

const initialState: AppSettingsState = {
  appSettings: {
    color: "default",
    theme: "light",
    defaultUseScoring: false,
    defaultUseRatings: false,
    defaultCourtLayout: "horizontal",
    defaultEnforceFixedPartnerships: true,
  },
  loading: false,
  error: null,
};

const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {
    setAppSettings: (state, action: PayloadAction<Settings>) => {
      state.appSettings = action.payload;
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

export const { setAppSettings, setLoading, setError } =
  appSettingsSlice.actions;

export default appSettingsSlice.reducer;
