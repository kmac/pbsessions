// src/store/slices/liveSessionSlice.ts (Minimal placeholder)
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSession: null,
  loading: false,
  error: null,
};

const liveSessionSlice = createSlice({
  name: 'liveSession',
  initialState,
  reducers: {},
});

export default liveSessionSlice.reducer;


