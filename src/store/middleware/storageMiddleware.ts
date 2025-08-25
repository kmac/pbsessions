import { Middleware, Action } from '@reduxjs/toolkit';
import { StorageManager } from '../../utils/storage';

// export const storageMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: Action) => {
export const storageMiddleware: Middleware = (store) => (next) => async (_action: unknown) => {

  // This is dumb, but I don't know how to get rid of the type problem:
  const action = _action as Action;

  const result = next(action);

  // Handle storage operations asynchronously without blocking the action
  const handleStorage = async () => {
    try {
      const storage = StorageManager.getInstance();
      const state = store.getState();

      // Auto-save on specific actions
      if (action.type?.startsWith('players/')) {
        await storage.savePlayers(state.players.players);
      }

      if (action.type?.startsWith('groups/')) {
        await storage.saveGroups(state.groups.groups);
      }

      if (action.type?.startsWith('sessions/')) {
        await storage.saveSessions(state.sessions.sessions);
      }

      // if (action.type?.startsWith('liveSession/')) {
      //   await storage.saveLiveSession(state.liveSession.currentSession);
      // }
    } catch (error) {
      console.error('Storage middleware error:', error);
      // Consider dispatching an error action here if needed
    }
  };

  // Execute storage operations without blocking the action flow
  handleStorage();

  return result;
};

