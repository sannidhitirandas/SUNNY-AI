import { memoryService } from './memoryService';
import { chatService } from './chatService';
import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/lib/api';
import { storageService } from './storageService';

export const privacyService = {
  async clearAllChatHistory(): Promise<void> {
    await chatService.clearMessages('default-session');
  },

  async clearAllMemories(): Promise<void> {
    await memoryService.clearAllMemories();
  },

  async deleteAccountAndAllData(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Please sign in again before deleting your account.');
    }

    const response = await fetch(apiUrl('/api/account'), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.error || 'Sunny could not complete account deletion. Please try again.'
      );
    }

    await supabase.auth.signOut({ scope: 'local' });
    const cacheCleared = await storageService.clearAccountCache();
    if (!cacheCleared) {
      console.warn('[privacyService] Account was deleted, but some local account cache could not be cleared.');
    }
  },

  getPrivacyHighlights(isAuthenticated: boolean) {
    return [
      {
        title: isAuthenticated ? 'Account data syncs through Supabase' : 'Guest data stays on this device',
        description: isAuthenticated
          ? 'Your chat history, saved memories, and preferences are associated with your Supabase account and sync across signed-in sessions.'
          : 'Guest chat history, saved memories, and preferences are stored in this app on this device. They are not attached to a cloud account.',
        icon: 'ShieldCheck',
      },
      {
        title: 'AI conversation processing',
        description: 'Messages and recent conversation context are sent to Sunny’s server and its configured AI provider to generate replies. Stored chat history follows the guest or signed-in storage described above.',
        icon: 'Heart',
      },
      {
        title: 'Memory is optional',
        description: 'When memory is enabled, Sunny can save useful conversation details. Guest memories stay on this device; signed-in memories are stored with your Supabase account.',
        icon: 'Lock',
      },
      {
        title: isAuthenticated ? 'Account deletion removes cloud data' : 'Guest data controls',
        description: isAuthenticated
          ? 'Deleting your account removes the Supabase Auth account and its related cloud rows. Sunny also clears account-associated local cache; separate guest-only data is kept.'
          : 'You can clear guest chat history or saved memories here. Guest data is not an account and cannot be deleted through the account deletion flow.',
        icon: 'Trash2',
      },
    ];
  },
};
