import { User, PersonalityTone } from '@/types/user';
import { supabase } from '@/lib/supabase';

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
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return mapSupabaseUser(user);
  },

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message ?? 'Unable to sign in.',
      };
    }

    return {
      success: true,
      user: mapSupabaseUser(data.user),
    };
  },

  async register(
    displayName: string,
    email: string,
    password: string,
    tone: PersonalityTone = 'adaptive'
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName,
          preferredTone: tone,
          preferredLanguage: 'English',
          memoryEnabled: true,
          createdAt: new Date().toISOString(),
        },
      },
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message ?? 'Unable to create account.',
      };
    }

    return {
      success: true,
      user: mapSupabaseUser(data.user),
    };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
};