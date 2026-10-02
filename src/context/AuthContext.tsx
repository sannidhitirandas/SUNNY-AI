import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { User, PersonalityTone } from '@/types/user';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { cloudStorageService } from '@/services/cloudStorageService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  passwordRecovery: boolean;
  completePasswordRecovery: (password: string) => Promise<{ success: boolean; error?: string }>;
  dismissPasswordRecovery: () => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    tone?: PersonalityTone
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const authRequestRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      const requestId = ++authRequestRef.current;
      try {
        const currentUser = await authService.getCurrentUser();

        if (mounted && requestId === authRequestRef.current) {
          if (currentUser) {
            try {
              await cloudStorageService.migrateLegacyLocalData();
            } catch (migrationError) {
              console.warn('[AuthContext] Legacy local data migration skipped:', migrationError);
            }
          }
          if (mounted && requestId === authRequestRef.current) {
            activeUserIdRef.current = currentUser?.id ?? null;
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.warn('Error loading user', error);

        if (mounted && requestId === authRequestRef.current) {
          activeUserIdRef.current = null;
          setUser(null);
        }
      } finally {
        if (mounted && requestId === authRequestRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (
        event === 'TOKEN_REFRESHED' &&
        session?.user?.id === activeUserIdRef.current
      ) {
        return;
      }
      const requestId = ++authRequestRef.current;
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);

      if (!session?.user) {
        activeUserIdRef.current = null;
        setPasswordRecovery(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const accountChanged = activeUserIdRef.current !== session.user.id;
      if (accountChanged) {
        activeUserIdRef.current = null;
        setUser(null);
        setIsLoading(true);
      }
      // Supabase recommends avoiding additional auth calls inside its auth callback.
      // Deferring this work prevents lock contention/deadlocks during sign-in refreshes.
      window.setTimeout(() => {
        void (async () => {
          try {
            const currentUser = await authService.getCurrentUser();
            if (
              currentUser &&
              (accountChanged || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')
            ) {
              try {
                await cloudStorageService.migrateLegacyLocalData();
              } catch (migrationError) {
                console.warn('[AuthContext] Legacy local data migration skipped:', migrationError);
              }
            }
            if (mounted && requestId === authRequestRef.current) {
              activeUserIdRef.current = currentUser?.id ?? null;
              setUser(currentUser);
            }
          } catch (error) {
            console.warn('[AuthContext] Could not refresh authenticated user:', error);
            if (mounted && requestId === authRequestRef.current) {
              activeUserIdRef.current = null;
              setUser(null);
            }
          } finally {
            if (mounted && requestId === authRequestRef.current) setIsLoading(false);
          }
        })();
      }, 0);
    });

    const onNativePasswordRecovery = () => setPasswordRecovery(true);
    window.addEventListener('sunny:password-recovery', onNativePasswordRecovery);

    return () => {
      mounted = false;
      window.removeEventListener('sunny:password-recovery', onNativePasswordRecovery);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);

    if (result.success && result.user) {
      setUser(result.user);
      activeUserIdRef.current = result.user.id;
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Login failed.',
    };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    tone: PersonalityTone = 'adaptive'
  ) => {
    const result = await authService.register(name, email, password, tone);

    if (result.success && result.user) {
      if (!result.requiresEmailConfirmation) {
        setUser(result.user);
        activeUserIdRef.current = result.user.id;
      }
      return {
        success: true,
        requiresEmailConfirmation: result.requiresEmailConfirmation,
      };
    }

    return {
      success: false,
      error: result.error || 'Registration failed.',
    };
  };

  const logout = async () => {
    ++authRequestRef.current;
    activeUserIdRef.current = null;
    setUser(null);
    setPasswordRecovery(false);
    await authService.logout();
  };

  const completePasswordRecovery = async (password: string) => {
    const result = await authService.updatePassword(password);
    if (result.success) setPasswordRecovery(false);
    return result;
  };

  const dismissPasswordRecovery = () => setPasswordRecovery(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        passwordRecovery,
        completePasswordRecovery,
        dismissPasswordRecovery,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};