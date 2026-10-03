import { NotificationPreferences, normalizeNotificationPreferences } from './notifications';

export type PersonalityTone = 'adaptive' | 'playful' | 'gentle' | 'calm';
export type SunnyTheme = 'sunny-dark' | 'sunny-light';
export type BackgroundMusicOption = 'ambient' | 'midnight-notes' | 'blossoms' | 'dust' | 'after-school-rain';

export interface AudioPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  selectedBackgroundMusic: BackgroundMusicOption;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  soundEnabled: true,
  musicEnabled: false,
  masterVolume: 0.75,
  sfxVolume: 0.75,
  musicVolume: 0.50,
  selectedBackgroundMusic: 'ambient',
};

export const normalizeAudioPreferences = (value?: Partial<AudioPreferences>): AudioPreferences => {
  const clamp = (val: unknown, def: number): number => {
    if (typeof val !== 'number' || isNaN(val)) return def;
    return Math.max(0, Math.min(1, val));
  };

  const validOptions: BackgroundMusicOption[] = ['ambient', 'midnight-notes', 'blossoms', 'dust', 'after-school-rain'];
  const selectedBackgroundMusic = validOptions.includes(value?.selectedBackgroundMusic as any)
    ? (value?.selectedBackgroundMusic as BackgroundMusicOption)
    : DEFAULT_AUDIO_PREFERENCES.selectedBackgroundMusic;

  return {
    soundEnabled: typeof value?.soundEnabled === 'boolean'
      ? value.soundEnabled
      : DEFAULT_AUDIO_PREFERENCES.soundEnabled,
    musicEnabled: typeof value?.musicEnabled === 'boolean'
      ? value.musicEnabled
      : DEFAULT_AUDIO_PREFERENCES.musicEnabled,
    masterVolume: clamp(value?.masterVolume, DEFAULT_AUDIO_PREFERENCES.masterVolume),
    sfxVolume: clamp(value?.sfxVolume, DEFAULT_AUDIO_PREFERENCES.sfxVolume),
    musicVolume: clamp(value?.musicVolume, DEFAULT_AUDIO_PREFERENCES.musicVolume),
    selectedBackgroundMusic,
  };
};

export interface UserPreferences {
  preferredTone: PersonalityTone;
  interests: string[];
  preferredName: string;
  memoryEnabled: boolean;
  notificationsEnabled: boolean;
  theme: SunnyTheme;
  notificationPreferences: NotificationPreferences;
  audioPreferences: AudioPreferences;
}

export const normalizeUserPreferences = (value: Partial<UserPreferences>): UserPreferences => {
  const notificationPreferences = normalizeNotificationPreferences(value.notificationPreferences);
  const audioPreferences = normalizeAudioPreferences(value.audioPreferences);
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
    audioPreferences,
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
