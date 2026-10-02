import React, { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';

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
  const { isAuthenticated, isLoading: authLoading, passwordRecovery } = useAuth();

  const {
    hasCompletedOnboarding,
    isLoading: prefsLoading,
  } = usePreferences();

  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeSubScreen, setActiveSubScreen] =
    useState<SubScreen>('none');
  const [authView, setAuthView] =
    useState<AuthScreen>('none');

  const route = resolveAppRoute({
    authLoading,
    preferencesLoading: prefsLoading,
    passwordRecovery,
    isAuthenticated,
    hasCompletedOnboarding,
    authView,
  });

  if (showSplash) {
    return (
      <SplashScreen
        onReady={() => setShowSplash(false)}
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
      />
    );
  }

  if (route === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={() => setAuthView('none')}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  if (route === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={() => setActiveTab('home')}
        onNavigateToLogin={() => setAuthView('login')}
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
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatScreen
            onNavigateToTab={(tab) => setActiveTab(tab)}
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
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onNavigateSubscreen={(sub) =>
              setActiveSubScreen(sub)
            }
            onReplayOnboarding={() =>
              setActiveTab('home')
            }
            onSignOut={() => setAuthView('login')}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#17102C]/95 backdrop-blur-md border-t border-[#392858] max-w-xl mx-auto w-full">
        <div className="flex items-center justify-around h-16 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
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
            onClick={() => setActiveTab('chat')}
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
            onClick={() => setActiveTab('memories')}
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
            onClick={() => setActiveTab('settings')}
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