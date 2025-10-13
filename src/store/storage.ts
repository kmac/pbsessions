import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Group, Player, Session, Settings } from "@/src/types";
import { Alert } from "@/src/utils/alert";
import { INITIAL_APP_SETTINGS } from "./slices/appSettingsSlice";
import { router } from "expo-router";
import { reloadAppAsync } from "expo";

const APPLICATION_BACKUP_VERSION = "1.0.0";

const STORAGE_KEYS = {
  PLAYERS: "@pickleball_players",
  GROUPS: "@pickleball_groups",
  SESSIONS: "@pickleball_sessions",
  APP_SETTINGS: "@pickleball_settings",
} as const;

export interface StoredData {
  players: Player[];
  groups: Group[];
  sessions: Session[];
  appSettings: Settings;
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

      if (Platform.OS === "web") {
        // Use localStorage as fallback on web
        try {
          await AsyncStorage.setItem(key, jsonData);
        } catch (asyncError) {
          console.warn(
            "AsyncStorage failed on web, using localStorage:",
            asyncError,
          );
          if (typeof window !== "undefined" && window.localStorage) {
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
    let jsonData: string | null = null;
    try {
      if (Platform.OS === "web") {
        try {
          jsonData = await AsyncStorage.getItem(key);
        } catch (asyncError) {
          console.warn(
            "AsyncStorage failed on web, using localStorage:",
            asyncError,
          );
          if (typeof window !== "undefined" && window.localStorage) {
            jsonData = window.localStorage.getItem(key);
          }
        }
      } else {
        jsonData = await AsyncStorage.getItem(key);
      }

      if (jsonData && jsonData !== undefined) {
        return JSON.parse(jsonData);
      }
      return null;
    } catch (error) {
      console.error(
        `Error loading data for key ${key}, jsonData: ${jsonData}`,
        error,
      );
      return null;
    }
  }

  async restoreAllData(data: StoredData): Promise<void> {
    try {
      // Validate that data has the expected structure
      if (
        !data.players ||
        !data.groups ||
        !data.sessions ||
        !data.appSettings
      ) {
        throw new Error("Invalid data structure");
      }
      // Save all data to storage
      await Promise.all([
        this.savePlayers(data.players),
        this.saveGroups(data.groups),
        this.saveSessions(data.sessions),
        this.saveAppSettings(data.appSettings),
      ]);
    } catch (error) {
      console.error("Error importing data:", error);
      throw new Error("Failed to import data");
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

  async saveAppSettings(appSettings: Settings): Promise<void> {
    await this.saveData(STORAGE_KEYS.APP_SETTINGS, appSettings);
  }

  async loadAppSettings(): Promise<Settings> {
    const setting = await this.loadData<Settings>(STORAGE_KEYS.APP_SETTINGS);
    return setting || INITIAL_APP_SETTINGS;
  }

  async backupAllData(): Promise<StoredData> {
    const [players, groups, sessions, appSettings] = await Promise.all([
      this.loadPlayers(),
      this.loadGroups(),
      this.loadSessions(),
      this.loadAppSettings(),
    ]);
    return {
      players,
      groups,
      sessions,
      appSettings,
      lastBackup: new Date().toISOString(),
      version: APPLICATION_BACKUP_VERSION,
    };
  }

  async clearAllData(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);

    if (Platform.OS === "web") {
      try {
        await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
      } catch (asyncError) {
        console.warn(
          "AsyncStorage clear failed on web, using localStorage:",
          asyncError,
        );
        if (typeof window !== "undefined" && window.localStorage) {
          keys.forEach((key) => window.localStorage.removeItem(key));
        }
      }
    } else {
      await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
    }
    this.restoreAllData({
      players: [],
      groups: [],
      sessions: [],
      appSettings: INITIAL_APP_SETTINGS,
      lastBackup: undefined,
      version: APPLICATION_BACKUP_VERSION,
    });
    reloadAppAsync()
  }
}
