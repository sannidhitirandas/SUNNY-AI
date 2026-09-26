import { storageService } from './storageService';
import { memoryService } from './memoryService';
import { chatService } from './chatService';

export const privacyService = {
  async exportAllUserData(): Promise<string> {
    const preferences = await storageService.getItem(storageService.KEYS.USER_PREFERENCES, {});
    const currentUser = await storageService.getItem(storageService.KEYS.CURRENT_USER, {});
    const memories = await memoryService.getMemories();
    const chatMessages = await chatService.getMessages();
    const notifications = await storageService.getItem(storageService.KEYS.NOTIFICATION_PREFERENCES, {});

    const exportPayload = {
      appName: 'Sunny AI Companion',
      exportDate: new Date().toISOString(),
      userProfile: currentUser,
      preferences,
      memories,
      chatMessages,
      notifications,
      disclaimer: 'Sunny demo mode data export. All data was stored locally on your device.',
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
    await storageService.clearAll();
  },

  getPrivacyHighlights() {
    return [
      {
        title: 'Local-First in Demo Mode',
        description: 'All your current messages, preferences, and saved memories stay strictly on your local device.',
        icon: 'shield-checkmark-outline',
      },
      {
        title: 'Memory with Consent',
        description: "Sunny only remembers details you explicitly choose to save. You can view, edit, or delete any memory at any time.",
        icon: 'heart-outline',
      },
      {
        title: 'Never Sold or Advertised',
        description: "Your conversations are personal reflections, never used for advertising profiles or third-party brokers.",
        icon: 'lock-closed-outline',
      },
      {
        title: 'Instant Data Purge',
        description: "One-tap controls allow you to export your data or permanently wipe your chat history and memory vault.",
        icon: 'trash-outline',
      },
    ];
  },
};
