import { Middleware, Action } from '@reduxjs/toolkit';
import { StorageManager } from "@/src/store/storage";

export const storageMiddleware: Middleware = (store) => (next) => async (_action) => {
  // This is dumb, but I don't know how to get rid of the type problem:
  const action = _action as Action;

  const result = next(action);
  const storage = StorageManager.getInstance();

  if (action.type.startsWith('players/')) {
    const state = store.getState();
    await storage.savePlayers(state.players.players);
  }

  if (action.type.startsWith('groups/')) {
    const state = store.getState();
    await storage.saveGroups(state.groups.groups);
  }

  if (action.type.startsWith('sessions/')) {
    const state = store.getState();
    await storage.saveSessions(state.sessions.sessions);
  }

  if (action.type.startsWith('appSettings/')) {
    const state = store.getState();
    await storage.saveAppSettings(state.appSettings.appSettings);
  }

  return result;
};
