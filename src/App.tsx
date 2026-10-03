import React, { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import { notificationService } from '@/services/notificationService';
import { audioService } from '@/services/audioService';

import { SplashScreen } from '@/screens/SplashScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { PasswordRecoveryScreen } from '@/screens/auth/PasswordRecoveryScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { MemoriesScreen } from '@/screens/MemoriesScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

import { NotificationPreferencesScreen } from '@/screens/settings/NotificationPreferencesScreen';
import { PrivacyScreen } from '@/screens/settings/PrivacyScreen';
import { SafetyScreen } from '@/screens/settings/SafetyScreen';
import { AboutScreen } from '@/screens/settings/AboutScreen';

import { OnboardingFlow } from '@/screens/onboarding/OnboardingFlow';
import { resolveAppRoute } from '@/lib/authRouting';
import { resolveAndroidBackAction, type AndroidBackState } from '@/lib/androidBackNavigation';

import {
  Home,
  MessageSquare,
  Bookmark,
  Settings,
} from 'lucide-react';

type Tab = 'home' | 'chat' | 'memories' | 'settings';

type SubScreen =
  | 'none'
  | 'notifications'
  | 'privacy'
  | 'safety'
  | 'about';

type AuthScreen = 'none' | 'login' | 'register';

export function App() {
  const { isAuthenticated, isLoading: authLoading, passwordRecovery, logout } = useAuth();
  const { enterChat } = useChat();

  const {
    preferences,
    hasCompletedOnboarding,
    isLoading: prefsLoading,
    updateNotificationPreferences,
  } = usePreferences();

  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeSubScreen, setActiveSubScreen] =
    useState<SubScreen>('none');
  const [authView, setAuthView] =
    useState<AuthScreen>('none');
  const screenBackHandlerRef = useRef<(() => boolean) | null>(null);
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const navigationStateRef = useRef<AndroidBackState>({
    showSplash: true,
    isLoading: true,
    isAuthenticated: false,
    activeTab: 'home',
    hasActiveSubscreen: false,
    authView: 'none',
    hasCompletedOnboarding: false,
    passwordRecovery: false,
  });
  const notificationPreferencesRef = useRef(preferences.notificationPreferences);
  notificationPreferencesRef.current = preferences.notificationPreferences;
  const updateNotificationPreferencesRef = useRef(updateNotificationPreferences);
  updateNotificationPreferencesRef.current = updateNotificationPreferences;

  const registerScreenBackHandler = useCallback((handler: (() => boolean) | null) => {
    screenBackHandlerRef.current = handler;
  }, []);

  const handleTabChange = (tab: Tab) => {
    if (tab !== 'chat') {
      if (preferences.audioPreferences.musicEnabled) {
        void audioService.playNonChatMusic(preferences.audioPreferences.selectedBackgroundMusic);
      } else {
        audioService.pauseMusic();
      }
    } else {
      if (preferences.audioPreferences.musicEnabled) {
        audioService.resumeMusic();
      }
    }
    setActiveTab(tab);
  };

  const handleEnterChat = async (entry: Parameters<typeof enterChat>[0]) => {
    await enterChat(entry);
    if (preferences.audioPreferences.musicEnabled) {
      audioService.resumeMusic();
    }
    setActiveTab('chat');
  };

  useEffect(() => {
    if (preferences.audioPreferences.musicEnabled && activeTab !== 'chat') {
      void audioService.playNonChatMusic(preferences.audioPreferences.selectedBackgroundMusic);
    }
  }, [preferences.audioPreferences.selectedBackgroundMusic, preferences.audioPreferences.musicEnabled, activeTab]);

  const handleSplashReady = useCallback(() => {
    setShowSplash(false);
  }, []);

  const route = resolveAppRoute({
    authLoading,
    preferencesLoading: prefsLoading,
    passwordRecovery,
    isAuthenticated,
    hasCompletedOnboarding,
    authView,
  });

  navigationStateRef.current = {
    showSplash,
    isLoading: authLoading || prefsLoading,
    isAuthenticated,
    activeTab,
    hasActiveSubscreen: activeSubScreen !== 'none',
    authView,
    hasCompletedOnboarding,
    passwordRecovery,
  };

  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

  useEffect(() => {
    if (prefsLoading || preferences.notificationPreferences.timezone === deviceTimezone) return;
    void updateNotificationPreferences({ timezone: deviceTimezone });
  }, [prefsLoading, preferences.notificationPreferences.timezone, deviceTimezone, updateNotificationPreferences]);

  useEffect(() => {
    if (prefsLoading) return;
    void notificationService
      .syncNotificationSchedule(preferences.notificationPreferences)
      .catch((error) => console.warn('[App] Could not reconcile local notifications:', error));
  }, [prefsLoading]);

  useEffect(() => notificationService.addNotificationTapListener(() => {
    setActiveSubScreen('none');
    setActiveTab('home');
  }), []);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let mounted = true;
    let listener: PluginListenerHandle | undefined;
    let appStateListener: PluginListenerHandle | undefined;
    void CapacitorApp.addListener('backButton', () => {
      if (screenBackHandlerRef.current?.()) return;

      switch (resolveAndroidBackAction(navigationStateRef.current)) {
        case 'close-subscreen':
          setActiveSubScreen('none');
          break;
        case 'show-home':
          setActiveTab('home');
          break;
        case 'show-login':
          setAuthView('login');
          break;
        case 'show-onboarding':
          setAuthView('none');
          break;
        case 'cancel-password-recovery':
          void logoutRef.current()
            .catch((error) => console.warn('[App] Could not end password recovery session:', error))
            .finally(() => setAuthView('login'));
          break;
        case 'exit':
          void CapacitorApp.exitApp();
          break;
        case 'ignore':
          break;
      }
    }).then((handle) => {
      if (mounted) listener = handle;
      else void handle.remove();
    });

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
      const currentPreferences = notificationPreferencesRef.current;
      const updatedPreferences = { ...currentPreferences, timezone: currentTimezone };
      notificationPreferencesRef.current = updatedPreferences;
      void (async () => {
        if (currentPreferences.timezone !== currentTimezone) {
          await updateNotificationPreferencesRef.current({ timezone: currentTimezone });
        }
        await notificationService.syncNotificationSchedule(updatedPreferences);
      })().catch((error) => console.warn('[App] Could not reconcile notifications on resume:', error));
    }).then((handle) => {
      if (mounted) appStateListener = handle;
      else void handle.remove();
    });

    return () => {
      mounted = false;
      void listener?.remove();
      void appStateListener?.remove();
    };
  }, []);

  if (showSplash) {
    return (
      <SplashScreen
        onReady={handleSplashReady}
      />
    );
  }

  if (route === 'loading') {
    return (
      <div className="min-h-screen bg-[#100B22] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-[#FFD84D] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (route === 'recovery') {
    return <PasswordRecoveryScreen />;
  }

  if (route === 'register') {
    return (
      <RegisterScreen
        onRegisterSuccess={() => setAuthView('none')}
        onNavigateToLogin={() => setAuthView('login')}
        registerHardwareBackHandler={registerScreenBackHandler}
      />
    );
  }

  if (route === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={() => setAuthView('none')}
        onNavigateToRegister={() => setAuthView('register')}
        registerHardwareBackHandler={registerScreenBackHandler}
      />
    );
  }

  if (route === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={() => setActiveTab('home')}
        onNavigateToLogin={() => setAuthView('login')}
        registerHardwareBackHandler={registerScreenBackHandler}
      />
    );
  }

  if (activeSubScreen === 'notifications') {
    return (
      <NotificationPreferencesScreen
        onBack={() => setActiveSubScreen('none')}
      />
    );
  }

  if (activeSubScreen === 'privacy') {
    return (
      <PrivacyScreen
        onBack={() => setActiveSubScreen('none')}
        onResetToOnboarding={() => {
          setActiveSubScreen('none');
          setActiveTab('home');
        }}
      />
    );
  }

  if (activeSubScreen === 'safety') {
    return (
      <SafetyScreen
        onBack={() => setActiveSubScreen('none')}
      />
    );
  }

  if (activeSubScreen === 'about') {
    return (
      <AboutScreen
        onBack={() => setActiveSubScreen('none')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#100B22] flex flex-col justify-between relative selection:bg-[#FFD84D] selection:text-[#100B22]">
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigateToTab={(tab) => handleTabChange(tab)}
            onEnterChat={handleEnterChat}
          />
        )}

        {activeTab === 'chat' && (
          <ChatScreen
            onNavigateToTab={(tab) => handleTabChange(tab)}
            onNavigateToSafety={() =>
              setActiveSubScreen('safety')
            }
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesScreen />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            onNavigateToTab={(tab) => handleTabChange(tab)}
            onNavigateSubscreen={(sub) =>
              setActiveSubScreen(sub)
            }
            onReplayOnboarding={() =>
              handleTabChange('home')
            }
            onSignOut={() => setAuthView('login')}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#17102C]/95 backdrop-blur-md border-t border-[#392858] max-w-xl mx-auto w-full">
        <div className="flex items-center justify-around h-16 px-2">
          <button
            type="button"
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'text-[#FFD84D]'
                : 'text-[#9B8AB9] hover:text-[#C6B8E5]'
            }`}
          >
            <Home
              size={20}
              strokeWidth={
                activeTab === 'home' ? 2.5 : 2
              }
            />
            <span className="text-[10px] font-semibold mt-1">
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleEnterChat({ source: 'normal' })}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'text-[#FFD84D]'
                : 'text-[#9B8AB9] hover:text-[#C6B8E5]'
            }`}
          >
            <MessageSquare
              size={20}
              strokeWidth={
                activeTab === 'chat' ? 2.5 : 2
              }
            />
            <span className="text-[10px] font-semibold mt-1">
              Chat
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('memories')}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all cursor-pointer ${
              activeTab === 'memories'
                ? 'text-[#FFD84D]'
                : 'text-[#9B8AB9] hover:text-[#C6B8E5]'
            }`}
          >
            <Bookmark
              size={20}
              strokeWidth={
                activeTab === 'memories' ? 2.5 : 2
              }
            />
            <span className="text-[10px] font-semibold mt-1">
              Memories
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-[#FFD84D]'
                : 'text-[#9B8AB9] hover:text-[#C6B8E5]'
            }`}
          >
            <Settings
              size={20}
              strokeWidth={
                activeTab === 'settings' ? 2.5 : 2
              }
            />
            <span className="text-[10px] font-semibold mt-1">
              Settings
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
