export type AuthView = 'none' | 'login' | 'register';
export type AppRoute = 'loading' | 'recovery' | 'login' | 'register' | 'onboarding' | 'application';

export function resolveAppRoute(state: {
  authLoading: boolean;
  preferencesLoading: boolean;
  passwordRecovery: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  authView: AuthView;
}): AppRoute {
  if (state.authLoading || state.preferencesLoading) return 'loading';
  if (state.passwordRecovery) return 'recovery';
  if (state.isAuthenticated) return 'application';
  if (state.authView === 'register') return 'register';
  if (state.authView === 'login' || state.hasCompletedOnboarding) return 'login';
  return 'onboarding';
}