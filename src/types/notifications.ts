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

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
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

export const isValidClockTime = (value: unknown): value is string =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const normalizeNotificationPreferences = (
  value?: Partial<NotificationPreferences> | null,
): NotificationPreferences => {
  const dailyLimit = value?.dailyLimit;
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...value,
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : DEFAULT_NOTIFICATION_PREFERENCES.enabled,
    dailyLimit: Number.isInteger(dailyLimit) && dailyLimit! >= 1 && dailyLimit! <= 10
      ? dailyLimit!
      : DEFAULT_NOTIFICATION_PREFERENCES.dailyLimit,
    morningTime: isValidClockTime(value?.morningTime) ? value.morningTime : DEFAULT_NOTIFICATION_PREFERENCES.morningTime,
    afternoonTime: isValidClockTime(value?.afternoonTime) ? value.afternoonTime : DEFAULT_NOTIFICATION_PREFERENCES.afternoonTime,
    eveningTime: isValidClockTime(value?.eveningTime) ? value.eveningTime : DEFAULT_NOTIFICATION_PREFERENCES.eveningTime,
    quietHoursStart: isValidClockTime(value?.quietHoursStart) ? value.quietHoursStart : DEFAULT_NOTIFICATION_PREFERENCES.quietHoursStart,
    quietHoursEnd: isValidClockTime(value?.quietHoursEnd) ? value.quietHoursEnd : DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnd,
    morningEnabled: typeof value?.morningEnabled === 'boolean' ? value.morningEnabled : DEFAULT_NOTIFICATION_PREFERENCES.morningEnabled,
    afternoonEnabled: typeof value?.afternoonEnabled === 'boolean' ? value.afternoonEnabled : DEFAULT_NOTIFICATION_PREFERENCES.afternoonEnabled,
    eveningEnabled: typeof value?.eveningEnabled === 'boolean' ? value.eveningEnabled : DEFAULT_NOTIFICATION_PREFERENCES.eveningEnabled,
    memoryFollowUpsEnabled: typeof value?.memoryFollowUpsEnabled === 'boolean' ? value.memoryFollowUpsEnabled : DEFAULT_NOTIFICATION_PREFERENCES.memoryFollowUpsEnabled,
    moodCheckInsEnabled: typeof value?.moodCheckInsEnabled === 'boolean' ? value.moodCheckInsEnabled : DEFAULT_NOTIFICATION_PREFERENCES.moodCheckInsEnabled,
    encouragementEnabled: typeof value?.encouragementEnabled === 'boolean' ? value.encouragementEnabled : DEFAULT_NOTIFICATION_PREFERENCES.encouragementEnabled,
    quietHoursEnabled: typeof value?.quietHoursEnabled === 'boolean' ? value.quietHoursEnabled : DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnabled,
    timezone: typeof value?.timezone === 'string' && value.timezone ? value.timezone : DEFAULT_NOTIFICATION_PREFERENCES.timezone,
  };
};

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'morning' | 'checkin' | 'encouragement' | 'memory' | 'evening';
  scheduledTime: string;
}
