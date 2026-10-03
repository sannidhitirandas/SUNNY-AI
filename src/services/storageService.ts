const memoryStore = new Map<string, string>();

const STORAGE_KEYS = {
  USER_PREFERENCES: '@sunny_user_preferences',
  CURRENT_USER: '@sunny_current_user',
  ONBOARDING_COMPLETED: '@sunny_onboarding_completed',
  MEMORIES: '@sunny_memories',
  CHAT_MESSAGES: '@sunny_chat_messages',
  NOTIFICATION_PREFERENCES: '@sunny_notification_preferences',
  NOTIFICATION_PERMISSION_CONSENT: '@sunny_notification_permission_consent',
  NOTIFICATION_PERMISSION_REQUESTED: '@sunny_notification_permission_requested',
  NOTIFICATION_SCHEDULE_STATE: '@sunny_notification_schedule_state',
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

  async clearAccountCache(): Promise<boolean> {
    const fixedKeys = [
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.CURRENT_USER,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.MEMORIES,
      STORAGE_KEYS.CHAT_MESSAGES,
      STORAGE_KEYS.NOTIFICATION_PREFERENCES,
      '@sunny_cloud_migration_v1',
    ];
    const accountChatKeys = new Set(
      [...memoryStore.keys()].filter((key) => key.startsWith('@sunny_chat_messages_')),
    );

    if (typeof window !== 'undefined' && window.localStorage) {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith('@sunny_chat_messages_') || key?.startsWith('@sunny_guest_memory_migration_')) {
          accountChatKeys.add(key);
        }
      }
    }

    const results = await Promise.all(
      [...fixedKeys, ...accountChatKeys].map((key) => this.removeItem(key)),
    );
    return results.every(Boolean);
  },

  KEYS: STORAGE_KEYS,
};
