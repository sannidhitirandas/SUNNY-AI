import { User, PersonalityTone } from '@/types/user';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { classifySignUpResult } from '@/lib/authValidation';

export const NATIVE_AUTH_CALLBACK_URL = 'sunnyai://auth/callback';

export const getAuthRedirectUrl = (): string => {
  if (Capacitor.isNativePlatform()) return NATIVE_AUTH_CALLBACK_URL;
  return window.location.origin;
};

const getFriendlyAuthError = (error: unknown, fallback: string): string => {
  const message = error instanceof Error ? error.message : '';
  const normalized = message.toLowerCase();
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'An account already exists for this email. Sign in or reset your password.';
  }
  if (normalized.includes('invalid login credentials') || normalized.includes('invalid credentials')) {
    return 'The email or password is incorrect. Check your details and try again.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please verify your email using the confirmation link before signing in.';
  }
  if (normalized.includes('fetch') || normalized.includes('network') || normalized.includes('timeout')) {
    return 'Sunny could not reach the authentication service. Check your connection and try again.';
  }
  return message || fallback;
};

const mapSupabaseUser = (supabaseUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): User => {
  const metadata = supabaseUser.user_metadata ?? {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName:
      typeof metadata.displayName === 'string'
        ? metadata.displayName
        : supabaseUser.email?.split('@')[0] ?? 'Sunny User',

    preferredTone:
      typeof metadata.preferredTone === 'string'
        ? (metadata.preferredTone as PersonalityTone)
        : 'adaptive',

    preferredLanguage:
      typeof metadata.preferredLanguage === 'string'
        ? metadata.preferredLanguage
        : 'English',

    memoryEnabled:
      typeof metadata.memoryEnabled === 'boolean'
        ? metadata.memoryEnabled
        : true,

    createdAt:
      typeof metadata.createdAt === 'string'
        ? metadata.createdAt
        : new Date().toISOString(),

    isDemoUser: false,
  };
};

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      const message = error?.message.toLowerCase() ?? '';
      if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
        return mapSupabaseUser(sessionData.session.user);
      }
      return null;
    }

    return mapSupabaseUser(user);
  },

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user || !data.session) {
        return {
          success: false,
          error: getFriendlyAuthError(error, 'Unable to sign in.'),
        };
      }

      return {
        success: true,
        user: mapSupabaseUser(data.user),
      };
    } catch (error) {
      return { success: false, error: getFriendlyAuthError(error, 'Unable to sign in.') };
    }
  },

  async register(
    displayName: string,
    email: string,
    password: string,
    tone: PersonalityTone = 'adaptive'
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    requiresEmailConfirmation?: boolean;
  }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            displayName: displayName.trim(),
            preferredTone: tone,
            preferredLanguage: 'English',
            memoryEnabled: true,
            createdAt: new Date().toISOString(),
          },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error || !data.user) {
        return {
          success: false,
          error: getFriendlyAuthError(error, 'Unable to create account.'),
        };
      }

      const signUpStatus = classifySignUpResult(
        Boolean(data.session),
        data.user.identities?.length
      );
      if (signUpStatus === 'duplicate') {
        return {
          success: false,
          error: 'An account already exists for this email. Sign in or reset your password.',
        };
      }

      return {
        success: true,
        user: mapSupabaseUser(data.user),
        requiresEmailConfirmation: signUpStatus === 'confirmation-required',
      };
    } catch (error) {
      return { success: false, error: getFriendlyAuthError(error, 'Unable to create account.') };
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthRedirectUrl(),
      });
      if (error) return { success: false, error: getFriendlyAuthError(error, 'Unable to send reset email.') };
      return { success: true };
    } catch (error) {
      return { success: false, error: getFriendlyAuthError(error, 'Unable to send reset email.') };
    }
  },

  async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { success: false, error: getFriendlyAuthError(error, 'Unable to update password.') };
      return { success: true };
    } catch (error) {
      return { success: false, error: getFriendlyAuthError(error, 'Unable to update password.') };
    }
  },

  async updateDisplayName(displayName: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const normalizedName = displayName.trim();
    if (!normalizedName || normalizedName.length > 60) {
      return { success: false, error: 'Enter a display name between 1 and 60 characters.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { displayName: normalizedName },
      });
      if (error || !data.user) {
        return { success: false, error: getFriendlyAuthError(error, 'Unable to update your profile name.') };
      }
      return { success: true, user: mapSupabaseUser(data.user) };
    } catch (error) {
      return { success: false, error: getFriendlyAuthError(error, 'Unable to update your profile name.') };
    }
  },

  async completeAuthRedirect(url: string): Promise<{ recovery: boolean; error?: string }> {
    try {
      const callback = new URL(url);
      const code = callback.searchParams.get('code');
      if (!code) return { recovery: false, error: 'The authentication link is missing its code.' };
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { recovery: false, error: getFriendlyAuthError(error, 'This authentication link is invalid or expired.') };
      return { recovery: callback.searchParams.get('type') === 'recovery' };
    } catch (error) {
      return { recovery: false, error: getFriendlyAuthError(error, 'Could not complete authentication.') };
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
};