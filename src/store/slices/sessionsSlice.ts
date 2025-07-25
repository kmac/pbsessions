import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, SessionState } from '@/src/types';

interface SessionsState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

const initialState: SessionsState = {
  sessions: [],
  loading: false,
  error: null,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    addSession: (state, action: PayloadAction<Omit<Session, 'id' | 'state' | 'createdAt' | 'updatedAt'>>) => {
      const now = new Date().toISOString();
      const newSession: Session = {
        ...action.payload,
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        state: SessionState.Unstarted,
        createdAt: now,
        updatedAt: now,
      };
      state.sessions.push(newSession);
    },
    updateSession: (state, action: PayloadAction<Session>) => {
      const index = state.sessions.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        const session = action.payload;

        if (session.state === SessionState.Live) {
          // TODO need to update live session
        }

        state.sessions[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
    },
    startLiveSession: (state, action: PayloadAction<string>) => {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) {
        session.state = SessionState.Live,
        session.updatedAt = new Date().toISOString();
      }
    },
    updateLiveSession: (state, action: PayloadAction<Session>) => {
      const session = state.sessions.find(s => s.id === action.payload.id);
      if (session) {
        if (session.state === SessionState.Live) {

          session.courts

          session.updatedAt = new Date().toISOString();
        }
      }
    },
    endSession: (state, action: PayloadAction<string>) => {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) {
        session.state = SessionState.Complete,
        session.updatedAt = new Date().toISOString();
      }
    },
    archiveSession: (state, action: PayloadAction<string>) => {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) {
        session.state = SessionState.Archived,
        session.updatedAt = new Date().toISOString();
      }
    },
    restoreSession: (state, action: PayloadAction<string>) => {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) {
        session.state = SessionState.Complete,
        session.updatedAt = new Date().toISOString();
      }
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
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
  addSession,
  archiveSession,
  endSession,
  removeSession,
  restoreSession,
  setError,
  setLoading,
  setSessions,
  startLiveSession,
  updateLiveSession,
  updateSession,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;
