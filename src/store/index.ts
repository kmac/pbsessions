// src/store/index.ts (Updated for Expo Router)
import { configureStore } from '@reduxjs/toolkit';
import playersReducer from './slices/playersSlice';
import groupsReducer from './slices/groupsSlice';
import sessionsReducer from './slices/sessionsSlice';
import liveSessionReducer from './slices/liveSessionSlice';
import { storageMiddleware } from './middleware/storageMiddleware';

export const store = configureStore({
  reducer: {
    players: playersReducer,
    groups: groupsReducer,
    sessions: sessionsReducer,
    liveSession: liveSessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }).concat(storageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for use throughout the app
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

