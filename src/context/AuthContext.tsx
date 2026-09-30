import React, { createContext, useContext, useEffect, useState } from 'react';

import { User, PersonalityTone } from '@/types/user';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { cloudStorageService } from '@/services/cloudStorageService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    tone?: PersonalityTone
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();

        if (mounted) {
          if (currentUser) {
            try {
              await cloudStorageService.migrateLegacyLocalData();
            } catch (migrationError) {
              console.warn('[AuthContext] Legacy local data migration skipped:', migrationError);
            }
          }
          setUser(currentUser);
        }
      } catch (error) {
        console.warn('Error loading user', error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) {
        return;
      }

      if (session?.user) {
        const currentUser = await authService.getCurrentUser();

        if (mounted) {
          if (currentUser) {
            try {
              await cloudStorageService.migrateLegacyLocalData();
            } catch (migrationError) {
              console.warn('[AuthContext] Legacy local data migration skipped:', migrationError);
            }
          }
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);

    if (result.success && result.user) {
      setUser(result.user);
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
      setUser(result.user);
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Registration failed.',
    };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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