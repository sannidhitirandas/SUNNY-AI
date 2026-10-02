import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PersonalityTone, UserPreferences } from '@/types/user';
import { cloudStorageService } from '@/services/cloudStorageService';
import { storageService } from '@/services/storageService';
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
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredTone: 'adaptive',
  interests: ['A little encouragement', 'A space to reflect on my day'],
  preferredName: 'Sunshine',
  memoryEnabled: true,
  notificationsEnabled: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadForSession = useCallback(async (userIsSignedIn: boolean) => {
    setIsLoading(true);
    try {
      if (userIsSignedIn) {
        const saved = await cloudStorageService.getPreferences();
        if (saved) {
          setPreferences(saved.preferences);
          setHasCompletedOnboarding(saved.onboardingCompleted);
          return;
        }

        // If this account has no cloud preferences yet, carry over this device's guest setup.
        const guestPreferences = await storageService.getItem<UserPreferences>(
          storageService.KEYS.GUEST_PREFERENCES,
          DEFAULT_PREFERENCES,
        );
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

      const guestPreferences = await storageService.getItem<UserPreferences>(
        storageService.KEYS.GUEST_PREFERENCES,
        DEFAULT_PREFERENCES,
      );
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
    setPreferences(nextPreferences);
    await persist(nextPreferences, hasCompletedOnboarding);
  };

  const updateTone = async (tone: PersonalityTone) => saveUpdatedPreferences({ ...preferences, preferredTone: tone });
  const updateInterests = async (interests: string[]) => saveUpdatedPreferences({ ...preferences, interests });
  const updatePreferredName = async (name: string) => saveUpdatedPreferences({ ...preferences, preferredName: name });
  const toggleMemory = async (enabled: boolean) => saveUpdatedPreferences({ ...preferences, memoryEnabled: enabled });
  const toggleNotifications = async (enabled: boolean) => saveUpdatedPreferences({ ...preferences, notificationsEnabled: enabled });

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await persist(preferences, true);
  };

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false);
    await persist(preferences, false);
  };

  return (
    <PreferencesContext.Provider value={{
      preferences, hasCompletedOnboarding, isLoading,
      updateTone, updateInterests, updatePreferredName,
      toggleMemory, toggleNotifications, completeOnboarding, resetOnboarding,
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
