// Placeholder slices for compilation
// src/store/slices/sessionsSlice.ts (Minimal placeholder)
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessions: [],
  loading: false,
  error: null,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {},
});

export default sessionsSlice.reducer;


