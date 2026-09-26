export type PersonalityTone = 'adaptive' | 'playful' | 'gentle' | 'calm';

export interface UserPreferences {
  preferredTone: PersonalityTone;
  interests: string[];
  preferredName: string;
  memoryEnabled: boolean;
  notificationsEnabled: boolean;
}

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
