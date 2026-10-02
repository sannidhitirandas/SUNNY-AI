import { memoryService } from './memoryService';
import { chatService } from './chatService';
import { cloudStorageService } from './cloudStorageService';
import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/lib/api';

export const privacyService = {
  async exportAllUserData(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const preferences = await cloudStorageService.getPreferences();
    const memories = await memoryService.getMemories();
    const chatMessages = await chatService.getMessages();

    const exportPayload = {
      appName: 'Sunny AI Companion',
      exportDate: new Date().toISOString(),
      account: user
        ? {
            id: user.id,
            email: user.email ?? null,
            createdAt: user.created_at,
          }
        : null,
      preferences: preferences?.preferences ?? null,
      onboardingCompleted: preferences?.onboardingCompleted ?? false,
      memories,
      chatMessages,
      note: 'This export contains the Sunny data currently associated with your signed-in account.',
    };

    return JSON.stringify(exportPayload, null, 2);
  },

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

    await supabase.auth.signOut();
  },

  getPrivacyHighlights() {
    return [
      {
        title: 'Cloud data tied to your account',
        description: 'Your Sunny chats, saved memories, and preferences are stored in your authenticated Supabase account.',
        icon: 'ShieldCheck',
      },
      {
        title: 'Memory with consent',
        description: 'When memory is enabled, Sunny automatically saves useful details from chat. Review, edit, or delete them at any time.',
        icon: 'Heart',
      },
      {
        title: 'No advertising profile',
        description: 'Sunny does not use your conversations to build an advertising profile.',
        icon: 'Lock',
      },
      {
        title: 'Data export & deletion',
        description: 'You can export your Sunny data, clear chat or memories, or permanently delete your account and associated cloud data.',
        icon: 'Trash2',
      },
    ];
  },
};
