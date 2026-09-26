import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@sunny_user_preferences',
  CURRENT_USER: '@sunny_current_user',
  ONBOARDING_COMPLETED: '@sunny_onboarding_completed',
  MEMORIES: '@sunny_memories',
  CHAT_MESSAGES: '@sunny_chat_messages',
  NOTIFICATION_PREFERENCES: '@sunny_notification_preferences',
};

export const storageService = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value) as T;
      }
      return defaultValue;
    } catch (error) {
      console.warn(`[storageService] Error getting item for key ${key}:`, error);
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[storageService] Error setting item for key ${key}:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[storageService] Error removing item for key ${key}:`, error);
      return false;
    }
  },

  async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.warn('[storageService] Error clearing all storage:', error);
      return false;
    }
  },

  KEYS: STORAGE_KEYS,
};
