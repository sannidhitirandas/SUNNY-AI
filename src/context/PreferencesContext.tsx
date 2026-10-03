import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
  normalizeUserPreferences,
  PersonalityTone,
  SunnyTheme,
  UserPreferences,
} from '@/types/user';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences, normalizeNotificationPreferences } from '@/types/notifications';
import { cloudStorageService } from '@/services/cloudStorageService';
import { storageService } from '@/services/storageService';
import { notificationService } from '@/services/notificationService';
import { audioService } from '@/services/audioService';
import { supabase } from '@/lib/supabase';

interface PreferencesContextType {
  preferences: UserPreferences;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  updateTone: (tone: PersonalityTone) => Promise<void>;
  updateInterests: (interests: string[]) => Promise<void>;
  updatePreferredName: (name: string) => Promise<void>;
  toggleMemory: (enabled: boolean) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  updateTheme: (theme: SunnyTheme) => Promise<void>;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  updateAudioPreferences: (updates: Partial<AudioPreferences>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  resetAfterAccountDeletion: () => Promise<void>;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredTone: 'adaptive',
  interests: ['A little encouragement', 'A space to reflect on my day'],
  preferredName: 'Sunshine',
  memoryEnabled: true,
  notificationsEnabled: false,
  theme: 'sunny-dark',
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  audioPreferences: DEFAULT_AUDIO_PREFERENCES,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadLocalPreferences = async (key: string) => {
    const saved = await storageService.getItem<Partial<UserPreferences>>(key, DEFAULT_PREFERENCES);
    const legacyNotifications = await notificationService.getLegacyPreferences();
    const normalized = normalizeUserPreferences({
      ...saved,
      ...(legacyNotifications ? {
        notificationsEnabled: typeof legacyNotifications.enabled === 'boolean'
          ? legacyNotifications.enabled
          : saved.notificationsEnabled,
        notificationPreferences: normalizeNotificationPreferences({
          ...saved.notificationPreferences,
          ...legacyNotifications,
        }),
      } : {}),
    });
    if (legacyNotifications) {
      await storageService.setItem(key, normalized);
      await storageService.removeItem(storageService.KEYS.NOTIFICATION_PREFERENCES);
    }
    return normalized;
  };

  const loadForSession = useCallback(async (userIsSignedIn: boolean) => {
    setIsLoading(true);
    try {
      if (userIsSignedIn) {
        const saved = await cloudStorageService.getPreferences();
        if (saved) {
          setPreferences(normalizeUserPreferences(saved.preferences));
          setHasCompletedOnboarding(saved.onboardingCompleted);
          return;
        }

        // If this account has no cloud preferences yet, carry over this device's guest setup.
        const guestPreferences = await loadLocalPreferences(storageService.KEYS.GUEST_PREFERENCES);
        const guestCompleted = await storageService.getItem<boolean>(
          storageService.KEYS.GUEST_ONBOARDING_COMPLETED,
          false,
        );
        setPreferences(guestPreferences);
        setHasCompletedOnboarding(guestCompleted);
        try {
          await cloudStorageService.savePreferences(guestPreferences, guestCompleted);
          await storageService.removeItem(storageService.KEYS.GUEST_PREFERENCES);
          await storageService.removeItem(storageService.KEYS.GUEST_ONBOARDING_COMPLETED);
        } catch (error) {
          // Keep the guest copy if cloud persistence is temporarily unavailable.
          console.warn('[PreferencesContext] Could not sync guest preferences yet:', error);
        }
        return;
      }

      const guestPreferences = await loadLocalPreferences(storageService.KEYS.GUEST_PREFERENCES);
      const guestCompleted = await storageService.getItem<boolean>(
        storageService.KEYS.GUEST_ONBOARDING_COMPLETED,
        false,
      );
      setPreferences(guestPreferences);
      setHasCompletedOnboarding(guestCompleted);
    } catch (error) {
      console.warn('[PreferencesContext] Could not load preferences:', error);
      if (!userIsSignedIn) {
        setPreferences(DEFAULT_PREFERENCES);
        setHasCompletedOnboarding(false);
      }
      const cachedPreferences = await loadLocalPreferences(storageService.KEYS.USER_PREFERENCES);
      setPreferences(cachedPreferences);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) await loadForSession(Boolean(data.session?.user));
    };
    void initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer Supabase queries until the auth callback releases its internal lock.
      window.setTimeout(() => {
        if (mounted) void loadForSession(Boolean(session?.user));
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadForSession]);

  const persist = async (nextPreferences: UserPreferences, onboardingCompleted: boolean) => {
    const { data } = await supabase.auth.getSession();
    await storageService.setItem(storageService.KEYS.USER_PREFERENCES, nextPreferences);
    await storageService.setItem(storageService.KEYS.ONBOARDING_COMPLETED, onboardingCompleted);
    if (data.session?.user) {
      try {
        await cloudStorageService.savePreferences(nextPreferences, onboardingCompleted);
      } catch (error) {
        // Do not block the UI or onboarding when the network/cloud is unavailable.
        console.warn('[PreferencesContext] Cloud preference save failed:', error);
      }
      return;
    }

    await storageService.setItem(storageService.KEYS.GUEST_PREFERENCES, nextPreferences);
    await storageService.setItem(storageService.KEYS.GUEST_ONBOARDING_COMPLETED, onboardingCompleted);
  };

  const saveUpdatedPreferences = async (nextPreferences: UserPreferences) => {
    const notificationSettingsChanged = nextPreferences.notificationPreferences !== preferences.notificationPreferences;
    setPreferences(nextPreferences);
    await persist(nextPreferences, hasCompletedOnboarding);
    if (notificationSettingsChanged) {
      try {
        await notificationService.syncNotificationSchedule(nextPreferences.notificationPreferences);
      } catch (error) {
        console.warn('[PreferencesContext] Could not reconcile local notification schedule:', error);
      }
    }
  };

  const updateTone = async (tone: PersonalityTone) => saveUpdatedPreferences({ ...preferences, preferredTone: tone });
  const updateInterests = async (interests: string[]) => saveUpdatedPreferences({ ...preferences, interests });
  const updatePreferredName = async (name: string) => saveUpdatedPreferences({ ...preferences, preferredName: name });
  const toggleMemory = async (enabled: boolean) => saveUpdatedPreferences({ ...preferences, memoryEnabled: enabled });
  const toggleNotifications = async (enabled: boolean) => saveUpdatedPreferences({
    ...preferences,
    notificationsEnabled: enabled,
    notificationPreferences: { ...preferences.notificationPreferences, enabled },
  });
  const updateTheme = async (theme: SunnyTheme) => saveUpdatedPreferences({ ...preferences, theme });
  const updateNotificationPreferences = async (updates: Partial<NotificationPreferences>) => {
    const notificationPreferences = { ...preferences.notificationPreferences, ...updates };
    const notificationsEnabled = typeof updates.enabled === 'boolean'
      ? updates.enabled
      : preferences.notificationsEnabled;
    await saveUpdatedPreferences(normalizeUserPreferences({
      ...preferences,
      notificationsEnabled,
      notificationPreferences,
    }));
  };

  const updateAudioPreferences = async (updates: Partial<AudioPreferences>) => {
    const audioPreferences = { ...preferences.audioPreferences, ...updates };
    await saveUpdatedPreferences(normalizeUserPreferences({
      ...preferences,
      audioPreferences,
    }));
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await persist(preferences, true);
  };

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false);
    await persist(preferences, false);
  };

  const resetAfterAccountDeletion = async () => {
    const guestPreferences = normalizeUserPreferences(
      await storageService.getItem<Partial<UserPreferences>>(
        storageService.KEYS.GUEST_PREFERENCES,
        DEFAULT_PREFERENCES,
      ),
    );
    setPreferences(guestPreferences);
    setHasCompletedOnboarding(false);
    await storageService.setItem(storageService.KEYS.GUEST_PREFERENCES, guestPreferences);
    await storageService.setItem(storageService.KEYS.GUEST_ONBOARDING_COMPLETED, false);
    try {
      await notificationService.syncNotificationSchedule(guestPreferences.notificationPreferences);
    } catch (error) {
      console.warn('[PreferencesContext] Could not reconcile notifications after account deletion:', error);
    }
  };

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);

  useEffect(() => {
    audioService.updateSettings(preferences.audioPreferences);
  }, [preferences.audioPreferences]);

  return (
    <PreferencesContext.Provider value={{
      preferences, hasCompletedOnboarding, isLoading,
      updateTone, updateInterests, updatePreferredName,
      toggleMemory, toggleNotifications, updateTheme, updateNotificationPreferences,
      updateAudioPreferences,
      completeOnboarding, resetOnboarding, resetAfterAccountDeletion,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider');
  return context;
};
