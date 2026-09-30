import { NotificationPreferences, NotificationItem } from '@/types/notifications';
import { storageService } from './storageService';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  dailyLimit: 3,
  morningEnabled: true,
  afternoonEnabled: true,
  eveningEnabled: true,
  memoryFollowUpsEnabled: true,
  moodCheckInsEnabled: true,
  encouragementEnabled: true,
  morningTime: '09:00',
  afternoonTime: '15:00',
  eveningTime: '21:00',
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  timezone: 'Local Time',
};

export const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'sample-1',
    category: 'morning',
    title: 'Good morning, sunshine ☀️',
    body: 'I hope today brings you one little thing to smile about.',
    scheduledTime: '9:00 AM',
  },
  {
    id: 'sample-2',
    category: 'checkin',
    title: 'Gentle check-in 💛',
    body: "How's your day going so far? No pressure to reply.",
    scheduledTime: '3:00 PM',
  },
  {
    id: 'sample-3',
    category: 'encouragement',
    title: 'Little love note 💛',
    body: 'Just a reminder: you deserve kindness, especially from yourself.',
    scheduledTime: '5:30 PM',
  },
  {
    id: 'sample-4',
    category: 'evening',
    title: 'Evening wind-down 🌙',
    body: 'Before the day ends, take a deep breath. You made it through today.',
    scheduledTime: '9:00 PM',
  },
];

export const notificationService = {
  async getPreferences(): Promise<NotificationPreferences> {
    return await storageService.getItem<NotificationPreferences>(
      storageService.KEYS.NOTIFICATION_PREFERENCES,
      DEFAULT_NOTIFICATION_PREFERENCES
    );
  },

  async savePreferences(preferences: NotificationPreferences): Promise<boolean> {
    return await storageService.setItem(
      storageService.KEYS.NOTIFICATION_PREFERENCES,
      preferences
    );
  },

  getSamplePreviews(): NotificationItem[] {
    return SAMPLE_NOTIFICATIONS;
  },

  getDeliveryStatus(): { connected: boolean; statusLabel: string } {
    return {
      connected: false,
      statusLabel: 'Not connected in demo mode (Local preview only)',
    };
  },
};
