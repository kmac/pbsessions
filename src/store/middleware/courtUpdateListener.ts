import { createListenerMiddleware } from "@reduxjs/toolkit";
import { updateCourtInSessionThunk } from "../actions/sessionActions";

export const courtUpdateListenerMiddleware = createListenerMiddleware();

// Map to store callbacks by session ID
const courtUpdateCallbacks = new Map<string, () => void>();

export const registerCourtUpdateCallback = (
  sessionId: string,
  callback: () => void,
) => {
  // console.log("REGISTER CALLBACK");
  courtUpdateCallbacks.set(sessionId, callback);
};

export const unregisterCourtUpdateCallback = (sessionId: string) => {
  // console.log("DELETE CALLBACK");
  courtUpdateCallbacks.delete(sessionId);
};

// Listen for court update completion
courtUpdateListenerMiddleware.startListening({
  actionCreator: updateCourtInSessionThunk.fulfilled,
  effect: (action, listenerApi) => {
    const { sessionId } = action.meta.arg;
    const callback = courtUpdateCallbacks.get(sessionId);

    if (callback) {
      // Small delay to ensure Redux state has propagated
      setTimeout(() => {
        // console.log("IN CALLBACK");
        callback();
      }, 200);
    }
  },
});
