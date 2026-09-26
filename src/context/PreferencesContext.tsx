import React, { createContext, useContext, useState, useEffect } from 'react';
import { PersonalityTone, UserPreferences } from '@/types/user';
import { storageService } from '@/services/storageService';

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

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredTone: 'adaptive',
  interests: ['A little encouragement', 'A space to reflect on my day'],
  preferredName: 'Sunshine',
  memoryEnabled: true,
  notificationsEnabled: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPrefs = await storageService.getItem<UserPreferences>(
        storageService.KEYS.USER_PREFERENCES,
        DEFAULT_PREFERENCES
      );
      const onboarded = await storageService.getItem<boolean>(
        storageService.KEYS.ONBOARDING_COMPLETED,
        false
      );
      setPreferences(savedPrefs);
      setHasCompletedOnboarding(onboarded);
    } catch (e) {
      console.warn('Error loading preferences', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUpdatedPreferences = async (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    await storageService.setItem(storageService.KEYS.USER_PREFERENCES, newPrefs);
  };

  const updateTone = async (tone: PersonalityTone) => {
    const updated = { ...preferences, preferredTone: tone };
    await saveUpdatedPreferences(updated);
  };

  const updateInterests = async (interests: string[]) => {
    const updated = { ...preferences, interests };
    await saveUpdatedPreferences(updated);
  };

  const updatePreferredName = async (name: string) => {
    const updated = { ...preferences, preferredName: name };
    await saveUpdatedPreferences(updated);
  };

  const toggleMemory = async (enabled: boolean) => {
    const updated = { ...preferences, memoryEnabled: enabled };
    await saveUpdatedPreferences(updated);
  };

  const toggleNotifications = async (enabled: boolean) => {
    const updated = { ...preferences, notificationsEnabled: enabled };
    await saveUpdatedPreferences(updated);
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await storageService.setItem(storageService.KEYS.ONBOARDING_COMPLETED, true);
  };

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false);
    await storageService.setItem(storageService.KEYS.ONBOARDING_COMPLETED, false);
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        hasCompletedOnboarding,
        isLoading,
        updateTone,
        updateInterests,
        updatePreferredName,
        toggleMemory,
        toggleNotifications,
        completeOnboarding,
        resetOnboarding,
      }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
