// src/store/middleware/storageMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { StorageManager } from '../../utils/storage';

export const storageMiddleware: Middleware = (store) => (next) => async (action) => {
  const result = next(action);
  const storage = StorageManager.getInstance();

  // Auto-save on specific actions
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

  if (action.type.startsWith('liveSession/')) {
    const state = store.getState();
    await storage.saveLiveSession(state.liveSession.currentSession);
  }

  return result;
};


