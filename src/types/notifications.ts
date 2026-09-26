export interface NotificationPreferences {
  enabled: boolean;
  dailyLimit: number;
  morningEnabled: boolean;
  afternoonEnabled: boolean;
  eveningEnabled: boolean;
  memoryFollowUpsEnabled: boolean;
  moodCheckInsEnabled: boolean;
  encouragementEnabled: boolean;
  morningTime: string;
  afternoonTime: string;
  eveningTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'morning' | 'checkin' | 'encouragement' | 'memory' | 'evening';
  scheduledTime: string;
}
