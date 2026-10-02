const memoryStore = new Map<string, string>();

const STORAGE_KEYS = {
  USER_PREFERENCES: '@sunny_user_preferences',
  CURRENT_USER: '@sunny_current_user',
  ONBOARDING_COMPLETED: '@sunny_onboarding_completed',
  MEMORIES: '@sunny_memories',
  CHAT_MESSAGES: '@sunny_chat_messages',
  NOTIFICATION_PREFERENCES: '@sunny_notification_preferences',
  GUEST_PREFERENCES: '@sunny_guest_preferences',
  GUEST_ONBOARDING_COMPLETED: '@sunny_guest_onboarding_completed',
  GUEST_MEMORIES: '@sunny_guest_memories',
};

export const storageService = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          return JSON.parse(item) as T;
        }
      } else {
        const item = memoryStore.get(key);
        if (item !== undefined) {
          return JSON.parse(item) as T;
        }
      }
      return defaultValue;
    } catch (error) {
      console.warn(`[storageService] Error getting item for key ${key}:`, error);
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, serialized);
      }
      memoryStore.set(key, serialized);
      return true;
    } catch (error) {
      console.warn(`[storageService] Error setting item for key ${key}:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      memoryStore.delete(key);
      return true;
    } catch (error) {
      console.warn(`[storageService] Error removing item for key ${key}:`, error);
      return false;
    }
  },

  async clearAll(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
      memoryStore.clear();
      return true;
    } catch (error) {
      console.warn('[storageService] Error clearing all storage:', error);
      return false;
    }
  },

  KEYS: STORAGE_KEYS,
};
