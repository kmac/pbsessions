import { createListenerMiddleware } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { StorageManager } from "@/src/store/storage";

// Use RTK listener middleware for better performance
// https://redux-toolkit.js.org/api/createListenerMiddleware
export const storageListenerMiddleware = createListenerMiddleware();

// Specific actions that should trigger storage
const STORAGE_ACTIONS = [
  'players/addPlayer',
  'players/updatePlayer',
  'players/deletePlayer',
  'groups/addGroup',
  'groups/updateGroup',
  'groups/deleteGroup',
  'sessions/addSession',
  'sessions/cloneSession',
  'sessions/updateSession',
  'sessions/removeSession',
  'sessions/archiveSession',
  'sessions/restoreSession',
  'appSettings/setAppSettings',
] as const;

// Listeners for each storage action
STORAGE_ACTIONS.forEach(actionType => {
  storageListenerMiddleware.startListening({
    predicate: (action) => action.type === actionType,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState() as RootState;
      const storage = StorageManager.getInstance();

      try {
        if (actionType.startsWith('players/')) {
          await storage.savePlayers(state.players.players);
        } else if (actionType.startsWith('groups/')) {
          await storage.saveGroups(state.groups.groups);
        } else if (actionType.startsWith('sessions/')) {
          await storage.saveSessions(state.sessions.sessions);
        } else if (actionType.startsWith('appSettings/')) {
          await storage.saveAppSettings(state.appSettings.appSettings);
        }
      } catch (error) {
        console.error(`Storage failed for ${actionType}:`, error);
      }
    },
  });
});
