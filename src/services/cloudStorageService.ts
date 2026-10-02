import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/types/chat';
import { Memory } from '@/types/memory';
import { UserPreferences } from '@/types/user';

const getUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('You need to be signed in to save Sunny data.');
  }
  return data.user.id;
};

export const cloudStorageService = {
  async getChatMessages(sessionId = 'default-session'): Promise<ChatMessage[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('sunny_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
      deliveryStatus: row.delivery_status,
      isDemoResponse: row.is_demo_response,
      model: row.model ?? undefined,
      errorMessage: row.error_message ?? undefined,
    }));
  },

  async saveChatMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const userId = await getUserId();
    if (messages.length === 0) return;

    const rows = messages.map((message) => ({
      id: message.id,
      user_id: userId,
      session_id: sessionId,
      role: message.role,
      content: message.content,
      created_at: message.createdAt,
      delivery_status: message.deliveryStatus,
      is_demo_response: message.isDemoResponse ?? false,
      model: message.model ?? null,
      error_message: message.errorMessage ?? null,
    }));

    const { error } = await supabase
      .from('sunny_chat_messages')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;
  },

  async clearChatMessages(sessionId = 'default-session'): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('sunny_chat_messages')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId);
    if (error) throw error;
  },

  async getMemories(): Promise<Memory[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('sunny_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_demo_data', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userConfirmed: row.user_confirmed,
      sourceSessionId: row.source_session_id ?? undefined,
      isDemoData: row.is_demo_data,
      memoryKey: row.memory_key ?? undefined,
      expiresAt: row.expires_at ?? undefined,
    }));
  },

  async saveMemory(memory: Memory): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase.from('sunny_memories').upsert({
      id: memory.id,
      user_id: userId,
      title: memory.title,
      content: memory.content,
      category: memory.category,
      created_at: memory.createdAt,
      updated_at: memory.updatedAt,
      user_confirmed: memory.userConfirmed,
      source_session_id: memory.sourceSessionId ?? null,
      is_demo_data: false,
      memory_key: memory.memoryKey ?? null,
      expires_at: memory.expiresAt ?? null,
    }, memory.memoryKey ? { onConflict: 'user_id,memory_key' } : { onConflict: 'id' });
    if (error) throw error;
  },

  async insertMemoryIfMissing(memory: Memory): Promise<boolean> {
    const userId = await getUserId();
    const { error } = await supabase.from('sunny_memories').insert({
      id: memory.id,
      user_id: userId,
      title: memory.title,
      content: memory.content,
      category: memory.category,
      created_at: memory.createdAt,
      updated_at: memory.updatedAt,
      user_confirmed: memory.userConfirmed,
      source_session_id: memory.sourceSessionId ?? null,
      is_demo_data: false,
      memory_key: memory.memoryKey ?? null,
      expires_at: memory.expiresAt ?? null,
    });
    if (error?.code === '23505') return false;
    if (error) throw error;
    return true;
  },

  async clearAllMemories(): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('sunny_memories')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteMemory(id: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('sunny_memories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async savePreferences(preferences: UserPreferences, onboardingCompleted: boolean): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase.from('sunny_preferences').upsert({
      user_id: userId,
      preferred_tone: preferences.preferredTone,
      interests: preferences.interests,
      preferred_name: preferences.preferredName,
      memory_enabled: preferences.memoryEnabled,
      notifications_enabled: preferences.notificationsEnabled,
      onboarding_completed: onboardingCompleted,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async getPreferences(): Promise<{ preferences: UserPreferences; onboardingCompleted: boolean } | null> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('sunny_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      preferences: {
        preferredTone: data.preferred_tone,
        interests: data.interests ?? [],
        preferredName: data.preferred_name,
        memoryEnabled: data.memory_enabled,
        notificationsEnabled: data.notifications_enabled,
      },
      onboardingCompleted: data.onboarding_completed,
    };
  },

  /**
   * One-time migration for users upgrading from Sunny's old localStorage-only version.
   * Local data is never deleted automatically. It is copied to the signed-in account
   * and a local marker prevents repeated migration attempts.
   */
  async migrateLegacyLocalData(): Promise<{
    migrated: boolean;
    chatSessions: number;
    chatMessages: number;
    memories: number;
    preferences: boolean;
  }> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { migrated: false, chatSessions: 0, chatMessages: 0, memories: 0, preferences: false };
    }

    const migrationKey = '@sunny_cloud_migration_v1';
    if (window.localStorage.getItem(migrationKey) === 'completed') {
      return { migrated: false, chatSessions: 0, chatMessages: 0, memories: 0, preferences: false };
    }

    const userId = await getUserId();
    let chatSessions = 0;
    let chatMessages = 0;
    let memories = 0;
    let preferences = false;

    // Migrate all legacy chat sessions stored under @sunny_chat_messages_<sessionId>.
    const chatKeys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith('@sunny_chat_messages_')) {
        chatKeys.push(key);
      }
    }

    for (const key of chatKeys) {
      const sessionId = key.slice('@sunny_chat_messages_'.length) || 'default-session';
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;

        const legacyMessages = parsed.filter(
          (message): message is ChatMessage =>
            message &&
            typeof message.id === 'string' &&
            typeof message.content === 'string' &&
            (message.role === 'user' || message.role === 'assistant' || message.role === 'system')
        );

        if (legacyMessages.length === 0) continue;

        const existing = await this.getChatMessages(sessionId);
        if (existing.length === 0) {
          await this.saveChatMessages(sessionId, legacyMessages);
          chatSessions += 1;
          chatMessages += legacyMessages.length;
        }
      } catch (error) {
        console.warn(`[cloudStorageService] Could not migrate chat key ${key}:`, error);
        throw error;
      }
    }

    // Migrate real memories only; legacy demo/sample memories are intentionally skipped.
    try {
      const rawMemories = window.localStorage.getItem('@sunny_memories');
      if (rawMemories) {
        const parsed = JSON.parse(rawMemories);
        if (Array.isArray(parsed)) {
          const legacyMemories = parsed.filter(
            (memory): memory is Memory =>
              memory &&
              typeof memory.id === 'string' &&
              typeof memory.title === 'string' &&
              typeof memory.content === 'string' &&
              !memory.isDemoData &&
              !memory.id.startsWith('demo-mem-')
          );

          const existingMemories = await this.getMemories();
          if (existingMemories.length === 0 && legacyMemories.length > 0) {
            await Promise.all(
              legacyMemories.map((memory) =>
                this.saveMemory({
                  ...memory,
                  userId,
                  isDemoData: false,
                })
              )
            );
            memories = legacyMemories.length;
          }
        }
      }
    } catch (error) {
      console.warn('[cloudStorageService] Could not migrate legacy memories:', error);
      throw error;
    }

    // Migrate saved preferences only when the account has no cloud preferences yet.
    try {
      const existingPreferences = await this.getPreferences();
      if (!existingPreferences) {
        const rawPreferences = window.localStorage.getItem('@sunny_user_preferences');
        const rawOnboarding = window.localStorage.getItem('@sunny_onboarding_completed');

        if (rawPreferences) {
          const parsedPreferences = JSON.parse(rawPreferences) as Partial<UserPreferences>;
          const onboardingCompleted = rawOnboarding
            ? JSON.parse(rawOnboarding) === true
            : false;

          const rawNotifications = window.localStorage.getItem('@sunny_notification_preferences');
          let notificationsEnabled =
            typeof parsedPreferences.notificationsEnabled === 'boolean'
              ? parsedPreferences.notificationsEnabled
              : true;

          if (rawNotifications) {
            try {
              const notificationPrefs = JSON.parse(rawNotifications) as { enabled?: unknown };
              if (typeof notificationPrefs.enabled === 'boolean') {
                notificationsEnabled = notificationPrefs.enabled;
              }
            } catch {
              // Keep the preference value already available in the main preferences object.
            }
          }

          await this.savePreferences(
            {
              preferredTone: parsedPreferences.preferredTone ?? 'adaptive',
              interests: Array.isArray(parsedPreferences.interests)
                ? parsedPreferences.interests.filter((item): item is string => typeof item === 'string')
                : [],
              preferredName:
                typeof parsedPreferences.preferredName === 'string'
                  ? parsedPreferences.preferredName
                  : 'Sunshine',
              memoryEnabled:
                typeof parsedPreferences.memoryEnabled === 'boolean'
                  ? parsedPreferences.memoryEnabled
                  : true,
              notificationsEnabled,
            },
            onboardingCompleted
          );
          preferences = true;
        }
      }
    } catch (error) {
      console.warn('[cloudStorageService] Could not migrate legacy preferences:', error);
      throw error;
    }

    window.localStorage.setItem(migrationKey, 'completed');

    return { migrated: true, chatSessions, chatMessages, memories, preferences };
  },

};
