// src/utils/storage.ts (Updated with better error handling for web)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Player, Group, Session, LiveSession } from '../types';
import { Alert } from './alert';

const STORAGE_KEYS = {
  PLAYERS: '@pickleball_players',
  GROUPS: '@pickleball_groups',
  SESSIONS: '@pickleball_sessions',
  LIVE_SESSION: '@pickleball_live_session',
  APP_CONFIG: '@pickleball_config',
} as const;

export interface StoredData {
  players: Player[];
  groups: Group[];
  sessions: Session[];
  liveSession: LiveSession | null;
  lastBackup?: string;
  version: string;
}

export class StorageManager {
  private static instance: StorageManager;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async saveData<T>(key: string, data: T): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);

      if (Platform.OS === 'web') {
        // Use localStorage as fallback on web
        try {
          await AsyncStorage.setItem(key, jsonData);
        } catch (asyncError) {
          console.warn('AsyncStorage failed on web, using localStorage:', asyncError);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, jsonData);
          }
        }
      } else {
        await AsyncStorage.setItem(key, jsonData);
      }
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      throw new Error(`Failed to save ${key} data`);
    }
  }

  async loadData<T>(key: string): Promise<T | null> {
    try {
      let jsonData: string | null = null;

      if (Platform.OS === 'web') {
        try {
          jsonData = await AsyncStorage.getItem(key);
        } catch (asyncError) {
          console.warn('AsyncStorage failed on web, using localStorage:', asyncError);
          if (typeof window !== 'undefined' && window.localStorage) {
            jsonData = window.localStorage.getItem(key);
          }
        }
      } else {
        jsonData = await AsyncStorage.getItem(key);
      }

      if (jsonData) {
        return JSON.parse(jsonData);
      }
      return null;
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      return null;
    }
  }

  async savePlayers(players: Player[]): Promise<void> {
    await this.saveData(STORAGE_KEYS.PLAYERS, players);
  }

  async loadPlayers(): Promise<Player[]> {
    const players = await this.loadData<Player[]>(STORAGE_KEYS.PLAYERS);
    return players || [];
  }

  async saveGroups(groups: Group[]): Promise<void> {
    await this.saveData(STORAGE_KEYS.GROUPS, groups);
  }

  async loadGroups(): Promise<Group[]> {
    const groups = await this.loadData<Group[]>(STORAGE_KEYS.GROUPS);
    return groups || [];
  }

  async saveSessions(sessions: Session[]): Promise<void> {
    await this.saveData(STORAGE_KEYS.SESSIONS, sessions);
  }

  async loadSessions(): Promise<Session[]> {
    const sessions = await this.loadData<Session[]>(STORAGE_KEYS.SESSIONS);
    return sessions || [];
  }

  async saveLiveSession(liveSession: LiveSession): Promise<void> {
    await this.saveData(STORAGE_KEYS.LIVE_SESSION, liveSession);
  }

  async loadLiveSession(): Promise<LiveSession|null> {
    const liveSession = await this.loadData<LiveSession>(STORAGE_KEYS.LIVE_SESSION)
    return liveSession;
  }

  async exportAllData(): Promise<StoredData> {
    const [players, groups, sessions, liveSession] = await Promise.all([
      this.loadPlayers(),
      this.loadGroups(),
      this.loadSessions(),
      this.loadLiveSession()
    ]);

    return {
      players,
      groups,
      sessions,
      liveSession,
      lastBackup: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  async clearAllData(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);

    if (Platform.OS === 'web') {
      try {
        await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
      } catch (asyncError) {
        console.warn('AsyncStorage clear failed on web, using localStorage:', asyncError);
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach(key => window.localStorage.removeItem(key));
        }
      }
    } else {
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    }
  }
}
