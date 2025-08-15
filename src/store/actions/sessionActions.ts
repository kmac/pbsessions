import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/src/store";
import { SessionService } from "@/src/services/sessionService";
import { updateSession } from "../slices/sessionsSlice";
import { Court, Session, PlayerStats, Results, RoundAssignment } from "@/src/types";

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

// Example: Start round with notifications and logging
// export const startRoundThunk = createSessionThunk(
//   'sessions/startRound',
//   (session) => SessionService.startRound(session),
//   {
//     beforeUpdate: (session, updatedSession, dispatch) => {
//       // Log the round start
//       console.log(`Starting round ${updatedSession.liveData?.rounds.length} for session ${session.id}`);
//
//       // Set loading state
//       dispatch(setLoading(true));
//     },
//     afterUpdate: (session, updatedSession, dispatch) => {
//       // Clear loading state
//       dispatch(setLoading(false));
//
//       // Dispatch notification
//       dispatch(addNotification({
//         message: `Round ${updatedSession.liveData?.rounds.length} started!`,
//         type: 'success'
//       }));
//
//       // Auto-save to external service
//       dispatch(saveSessionToCloud(updatedSession));
//     }
//   }
// );

// Usage:  applyNextRoundThunk({sessionId: 'asfa', assignment: {} as RoundAssignment});
export const applyNextRoundThunk = createAsyncThunkForSession<{
  sessionId: string;
  assignment: RoundAssignment;
}>("sessions/applyNextRound", (session, { assignment }) =>
  SessionService.applyNextRound(session, assignment),
);

export const updateCurrentRoundThunk = createAsyncThunkForSession<{
  sessionId: string;
  assignment: RoundAssignment;
}>("sessions/updateCurrentRound", (session, { assignment }) =>
  SessionService.updateCurrentRound(session, assignment),
);

export const startLiveSessionThunk = createAsyncThunkForSession<{
  sessionId: string }>(
  "sessions/startLiveSession",
  (session ) => SessionService.startLiveSession(session),
);

export const endSessionThunk = createAsyncThunkForSession<{
  sessionId: string }>(
  "sessions/endSession",
  (session ) => SessionService.endSession(session),
);

export const startRoundThunk = createAsyncThunkForSession<{
  sessionId: string; }>(
  "sessions/startRound",
  (session) => SessionService.startRound(session),
);

export const completeRoundThunk = createAsyncThunkForSession<{
  sessionId: string;
  results: Results;
  updatedPlayerStats: PlayerStats[]}>(
  "sessions/completeRound",
  (session, { results, updatedPlayerStats }) => SessionService.completeRound(session, results, updatedPlayerStats),
);

export const addCourtToSessionThunk = createAsyncThunkForSession<{
  sessionId: string, court: Court }>(
  "sessions/addCourt",
  (session, { court } ) => SessionService.addCourt(session, court),
);

export const updateCourtInSessionThunk = createAsyncThunkForSession<{
  sessionId: string, court: Court }>(
  "sessions/updateCourt",
  (session, { court } ) => SessionService.updateCourt(session, court),
);

export const removeCourtFromSessionThunk = createAsyncThunkForSession<{
  sessionId: string, courtId: string }>(
  "sessions/removeCourt",
  (session, { courtId } ) => SessionService.removeCourt(session, courtId),
);

export const addPlayerToSessionThunk = createAsyncThunkForSession<{
  sessionId: string, playerId: string }>(
  "sessions/addPlayer",
  (session, { playerId } ) => SessionService.addPlayer(session, playerId)
);

export const removePlayerFromSessionThunk = createAsyncThunkForSession<{
  sessionId: string, playerId: string }>(
  "sessions/removePlayer",
  (session, { playerId } ) => SessionService.removePlayer(session, playerId)
);
