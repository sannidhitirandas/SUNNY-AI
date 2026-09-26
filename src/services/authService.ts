import { User, PersonalityTone } from '@/types/user';
import { storageService } from './storageService';

const DEFAULT_DEMO_USER: User = {
  id: 'sunny-demo-user-1',
  displayName: 'Sunshine Friend',
  email: 'sunshine@example.com',
  createdAt: new Date().toISOString(),
  preferredTone: 'adaptive',
  preferredLanguage: 'English',
  memoryEnabled: true,
  isDemoUser: true,
};

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    return await storageService.getItem<User | null>(storageService.KEYS.CURRENT_USER, DEFAULT_DEMO_USER);
  },

  async login(email: string, _password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const user: User = {
      id: `user-${Date.now()}`,
      displayName: email.split('@')[0],
      email,
      createdAt: new Date().toISOString(),
      preferredTone: 'adaptive',
      preferredLanguage: 'English',
      memoryEnabled: true,
      isDemoUser: true,
    };
    await storageService.setItem(storageService.KEYS.CURRENT_USER, user);
    return { success: true, user };
  },

  async register(
    displayName: string,
    email: string,
    password: string,
    tone: PersonalityTone = 'adaptive'
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!displayName.trim()) {
      return { success: false, error: 'Please enter your name or nickname.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password should be at least 6 characters long.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      preferredTone: tone,
      preferredLanguage: 'English',
      memoryEnabled: true,
      isDemoUser: true,
    };

    await storageService.setItem(storageService.KEYS.CURRENT_USER, newUser);
    return { success: true, user: newUser };
  },

  async enterAsDemoGuest(): Promise<User> {
    await storageService.setItem(storageService.KEYS.CURRENT_USER, DEFAULT_DEMO_USER);
    return DEFAULT_DEMO_USER;
  },

  async logout(): Promise<void> {
    await storageService.removeItem(storageService.KEYS.CURRENT_USER);
  },
};
