import { NotificationPreferences, normalizeNotificationPreferences } from './notifications';

export type PersonalityTone = 'adaptive' | 'playful' | 'gentle' | 'calm';
export type SunnyTheme = 'sunny-dark' | 'sunny-light';

export interface UserPreferences {
  preferredTone: PersonalityTone;
  interests: string[];
  preferredName: string;
  memoryEnabled: boolean;
  notificationsEnabled: boolean;
  theme: SunnyTheme;
  notificationPreferences: NotificationPreferences;
}

export const normalizeUserPreferences = (value: Partial<UserPreferences>): UserPreferences => {
  const notificationPreferences = normalizeNotificationPreferences(value.notificationPreferences);
  const notificationsEnabled = typeof value.notificationsEnabled === 'boolean'
    ? value.notificationsEnabled
    : notificationPreferences.enabled;

  return {
    preferredTone: value.preferredTone ?? 'adaptive',
    interests: Array.isArray(value.interests) ? value.interests.filter((item): item is string => typeof item === 'string') : [],
    preferredName: typeof value.preferredName === 'string' ? value.preferredName : 'Sunshine',
    memoryEnabled: typeof value.memoryEnabled === 'boolean' ? value.memoryEnabled : true,
    notificationsEnabled,
    theme: value.theme === 'sunny-light' ? 'sunny-light' : 'sunny-dark',
    notificationPreferences: { ...notificationPreferences, enabled: notificationsEnabled },
  };
};

export interface User {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  preferredTone: PersonalityTone;
  preferredLanguage: string;
  memoryEnabled: boolean;
  isDemoUser: boolean;
}
