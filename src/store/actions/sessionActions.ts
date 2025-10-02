import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "@/src/store";
import { SessionService } from "@/src/services/sessionService";
import { updateSession } from "../slices/sessionsSlice";
import { logSession } from "@/src/utils/util";
import {
  Court,
  Session,
  Player,
  PlayerStats,
  Results,
  RoundAssignment,
  FixedPartnership,
} from "@/src/types";

// In your components:
// import { applyNextRoundThunk, updateGameScoreThunk } from '@/src/store/actions/sessionActions';

// Helper function to wrap createAsyncThunk for a Session
const createAsyncThunkForSession = <
  TArgs extends { sessionId: string },
  TResult = Session,
>(
  actionType: string,
  sessionOperation: (
    session: Session,
    args: Omit<TArgs, "sessionId">,
  ) => Session,
) => {
  return createAsyncThunk<TResult, TArgs>(
    actionType,
    async (args, { dispatch, getState, rejectWithValue }) => {
      try {
        const state = getState() as RootState;
        const session = state.sessions.sessions.find(
          (s) => s.id === args.sessionId,
        );
        if (!session) {
          return rejectWithValue(`Session ${args.sessionId} not found`);
        }
        const { sessionId, ...operationArgs } = args;

        // invoke the passed-in operation
        const updatedSession = sessionOperation(
          session,
          operationArgs as Omit<TArgs, "sessionId">,
        );

        logSession(
          session,
          `Dispatching session update, sessionId=${sessionId}, name=${updatedSession.name}`,
        );
        dispatch(updateSession(updatedSession));

        return updatedSession as TResult;
      } catch (error: unknown) {
        let message: string = "unknown";
        if (typeof error === "string") {
          message = error;
        } else if (error instanceof Error) {
          message = error.message;
        }
        console.error(`Session action ${actionType}, message=${message}`);
        return rejectWithValue(message);
      }
    },
  );
};

const createFullAsyncThunkForSession = <
  TArgs extends { sessionId: string },
  TResult = Session,
>(
  actionType: string,
  sessionOperation: (
    session: Session,
    args: Omit<TArgs, "sessionId">,
  ) => Session,
  sideEffects?: {
    beforeUpdate?: (
      session: Session,
      updatedSession: Session,
      dispatch: any,
    ) => void;
    afterUpdate?: (
      session: Session,
      updatedSession: Session,
      dispatch: any,
    ) => void;
  },
) => {
  return createAsyncThunk<TResult, TArgs>(
    actionType,
    async (args, { dispatch, getState, rejectWithValue }) => {
      try {
        const state = getState() as RootState;
        const session = state.sessions.sessions.find(
          (s) => s.id === args.sessionId,
        );

        if (!session) {
          return rejectWithValue(`Session ${args.sessionId} not found`);
        }

        const { sessionId, ...operationArgs } = args;
        const updatedSession = sessionOperation(
          session,
          operationArgs as Omit<TArgs, "sessionId">,
        );

        // Execute before update side effects
        sideEffects?.beforeUpdate?.(session, updatedSession, dispatch);

        logSession(session, "Dispatching session update");
        dispatch(updateSession(updatedSession));

        // Execute after update side effects
        sideEffects?.afterUpdate?.(session, updatedSession, dispatch);

        return updatedSession as TResult;
      } catch (error: unknown) {
        let message: string = "unknown";
        if (typeof error === "string") {
          message = error;
        } else if (error instanceof Error) {
          message = error.message;
        }
        return rejectWithValue(message);
      }
    },
  );
};

export const applyNextRoundThunk = createAsyncThunkForSession<{
  sessionId: string;
  assignment: RoundAssignment;
}>("sessions/applyNextRound", (session, { assignment }) => {
  return SessionService.applyNextRound(session, assignment);
});

export const updateCurrentRoundThunk = createAsyncThunkForSession<{
  sessionId: string;
  assignment: RoundAssignment;
}>("sessions/updateCurrentRound", (session, { assignment }) => {
  return SessionService.updateCurrentRound(session, assignment);
});

export const startLiveSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
}>("sessions/startLiveSession", (session) => {
  return SessionService.startLiveSession(session);
});

export const endSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
}>("sessions/endSession", (session) => {
  return SessionService.endSession(session);
});

export const startRoundThunk = createAsyncThunkForSession<{
  sessionId: string;
}>("sessions/startRound", (session) => {
  return SessionService.startRound(session);
});

export const completeRoundThunk = createAsyncThunkForSession<{
  sessionId: string;
  results: Results;
  updatedPlayerStats: PlayerStats[];
}>("sessions/completeRound", (session, { results, updatedPlayerStats }) => {
  return SessionService.completeRound(session, results, updatedPlayerStats);
});

export const addCourtToSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  court: Court;
}>("sessions/addCourt", (session, { court }) => {
  return SessionService.addCourt(session, court);
});

export const updateCourtInSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  court: Court;
}>("sessions/updateCourt", (session, { court }) => {
  return SessionService.updateCourt(session, court);
});

export const removeCourtFromSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  courtId: string;
}>("sessions/removeCourt", (session, { courtId }) => {
  return SessionService.removeCourt(session, courtId);
});

export const addPlayerToSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  playerId: string;
}>("sessions/addPlayer", (session, { playerId }) => {
  return SessionService.addPlayer(session, playerId);
});

export const removePlayerFromSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  playerId: string;
}>("sessions/removePlayer", (session, { playerId }) => {
  return SessionService.removePlayer(session, playerId);
});

export const togglePausePlayerInSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  playerId: string;
}>("sessions/togglePausePlayer", (session, { playerId }) => {
  return SessionService.togglePausePlayer(session, playerId);
});

export const addPartnershipToSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  player1Id: string;
  player2Id: string;
}>("sessions/addPartnership", (session, { player1Id, player2Id }) => {
  return SessionService.addPartnership(session, player1Id, player2Id);
});

export const removePartnershipFromSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  playerId: string;
}>("sessions/removePartnership", (session, { playerId }) => {
  return SessionService.removePartnership(session, playerId);
});

export const updatePartnershipInSessionThunk = createAsyncThunkForSession<{
  sessionId: string;
  playerId: string;
  newPartnerId: string | null;
}>("sessions/updatePartnership", (session, { playerId, newPartnerId }) => {
  return SessionService.updatePartnership(session, playerId, newPartnerId);
});
