import React, { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { MOBILE_QUERY } from '@/lib/chatBackground';
import { Keyboard } from '@capacitor/keyboard';
import { Browser } from '@capacitor/browser';
import { authService } from '@/services/authService';
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
import { apiUrl } from '@/lib/api';
import GooeyDock from '@/components/ui/gooey-dock';

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

  // Silent background warm-up ping to wake up the Render backend server on app launch
  useEffect(() => {
    const warmUpServer = async () => {
      try {
        await fetch(apiUrl('/api/health'), { method: 'GET' }).catch(() => {});
      } catch {
        // Ignore warm-up network errors
      }
    };
    void warmUpServer();
  }, []);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  // Desktop web only: in chat the message box sits flush at the bottom and the
  // nav dock stays hidden until the user goes "back". Phones and the native app
  // keep the always-available dock.
  const [isWebDesktop, setIsWebDesktop] = useState(false);
  const [navRevealed, setNavRevealed] = useState(false);
  const navRevealedRef = useRef(false);
  navRevealedRef.current = navRevealed;
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
    setIsKeyboardVisible(false);
    setNavRevealed(false);
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

  const handleTabChangeRef = useRef(handleTabChange);
  handleTabChangeRef.current = handleTabChange;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsWebDesktop(!mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (activeTab !== 'chat') setNavRevealed(false);
  }, [activeTab]);

  // Browser Back inside desktop chat: 1st press slides the nav up under the
  // message box, 2nd press goes Home (same as Android back).
  useEffect(() => {
    if (activeTab !== 'chat' || !isWebDesktop) return;

    window.history.pushState({ sunnyChatNav: true }, '');
    const onPopState = () => {
      if (navRevealedRef.current) {
        handleTabChangeRef.current('home');
        return;
      }
      setNavRevealed(true);
      window.history.pushState({ sunnyChatNav: true }, '');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeTab, isWebDesktop]);

  // Keyboard visibility.
  // - Web/PWA: infer it from the visual viewport shrinking.
  // - Native (Capacitor): use the plugin's events only. On native the whole
  //   WebView resizes, so visualViewport and innerHeight shrink together and the
  //   web check would wrongly report "keyboard closed", fighting the real events
  //   and making the layout jump.
  useEffect(() => {
    if (activeTab !== 'chat') {
      setIsKeyboardVisible(false);
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      const handleResize = () => {
        if (window.visualViewport) {
          setIsKeyboardVisible(window.visualViewport.height < window.innerHeight - 150);
        }
      };
      window.visualViewport?.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }

    let mounted = true;
    let showSub: PluginListenerHandle | undefined;
    let hideSub: PluginListenerHandle | undefined;

    void Keyboard.addListener('keyboardWillShow', () => {
      if (mounted) setIsKeyboardVisible(true);
    }).then((sub) => {
      if (mounted) showSub = sub;
      else void sub.remove();
    });

    void Keyboard.addListener('keyboardWillHide', () => {
      if (mounted) setIsKeyboardVisible(false);
    }).then((sub) => {
      if (mounted) hideSub = sub;
      else void sub.remove();
    });

    return () => {
      mounted = false;
      void showSub?.remove();
      void hideSub?.remove();
    };
  }, [activeTab]);

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
    if (!Capacitor.isNativePlatform()) return;

    let mounted = true;
    let listener: PluginListenerHandle | undefined;

    void CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('sunnyai://auth/callback')) return;

      try {
        await Browser.close();

        const result = await authService.completeAuthRedirect(url);

        if (!mounted) return;

        if (result.error) {
          console.error('[Google Auth] Callback failed:', result.error);
          return;
        }

        if (result.recovery) {
          console.info('[Google Auth] Password recovery callback received.');
        }
      } catch (error) {
        console.error('[Google Auth] Could not complete callback:', error);
      }
    }).then((handle) => {
      if (mounted) listener = handle;
      else void handle.remove();
    });

    return () => {
      mounted = false;
      void listener?.remove();
    };
  }, []);

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
      if (!isActive) {
        setIsKeyboardVisible(false);
        return;
      }
      setIsKeyboardVisible(false);
      const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
      const currentPreferences = notificationPreferencesRef.current;
      if (currentPreferences.timezone !== currentTimezone) {
        const updatedPreferences = { ...currentPreferences, timezone: currentTimezone };
        notificationPreferencesRef.current = updatedPreferences;
        void (async () => {
          await updateNotificationPreferencesRef.current({ timezone: currentTimezone });
          await notificationService.syncNotificationSchedule(updatedPreferences);
        })().catch((error) => console.warn('[App] Could not reconcile notifications on resume:', error));
      }
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
      <div className="sunny-prehome-loading min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <style>{`
          .sunny-prehome-loading { position:relative; isolation:isolate; background:transparent; color:#F2EFE8; }
          .sunny-prehome-video-backdrop { position:absolute; inset:0; z-index:-1; overflow:hidden; background:#121417; }
          .sunny-prehome-video-backdrop video { width:100%; height:100%; object-fit:cover; filter:none; }
          .sunny-prehome-video-backdrop::after { content:''; position:absolute; inset:0; background:transparent; }
          .sunny-prehome-loading .border-\\[\\#FFD84D\\] { border-color:#E8E1D5; }
          .sunny-prehome-loading-content { text-shadow:0 1px 2px rgba(0,0,0,.98),0 3px 10px rgba(0,0,0,.95),0 8px 24px rgba(0,0,0,.88); }
        `}</style>
        <div className="sunny-prehome-video-backdrop" aria-hidden="true">
          <video autoPlay muted loop playsInline preload="metadata">
            <source src="/sunny-home-background.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="sunny-prehome-loading-content" role="status" aria-live="polite" aria-label="Sunny is getting ready">
          <div className="w-8 h-8 rounded-full border-3 border-[#E8E1D5] border-t-transparent animate-spin" />
          <span className="mt-4 text-[11px] font-bold tracking-[0.18em] text-[#E8E1D5]">GETTING SUNNY READY</span>
        </div>
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

  const chatNavHidden =
    activeTab === 'chat' && (isKeyboardVisible || (isWebDesktop && !navRevealed));
  const hideNavBar = chatNavHidden;

  return (
    <div className="sunny-app-shell h-dvh min-h-0 overflow-hidden bg-[#100B22] flex flex-col relative selection:bg-[#FFD84D] selection:text-[#100B22]">
      <main className={`sunny-app-main flex-1 min-h-0 flex flex-col overflow-hidden ${activeTab === 'chat' ? 'pb-0' : 'pb-24'}`}>
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
            onFocus={() => setIsKeyboardVisible(true)}
            onBlur={() => setIsKeyboardVisible(false)}
            isKeyboardVisible={isKeyboardVisible}
            isNavHidden={chatNavHidden}
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

      <GooeyDock
        hidden={hideNavBar}
        items={[
          {
            icon: Home,
            label: 'Home',
            active: activeTab === 'home',
            onClick: () => handleTabChange('home'),
          },
          {
            icon: MessageSquare,
            label: 'Chat',
            active: activeTab === 'chat',
            onClick: () => void handleEnterChat({ source: 'normal' }),
          },
          {
            icon: Bookmark,
            label: 'Memories',
            active: activeTab === 'memories',
            onClick: () => handleTabChange('memories'),
          },
          {
            icon: Settings,
            label: 'Settings',
            active: activeTab === 'settings',
            onClick: () => handleTabChange('settings'),
          },
        ]}
      />
    </div>
  );
}

export default App;
