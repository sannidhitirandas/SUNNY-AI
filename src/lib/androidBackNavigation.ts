export type AndroidBackAction =
  | 'ignore'
  | 'close-subscreen'
  | 'show-home'
  | 'show-login'
  | 'show-onboarding'
  | 'cancel-password-recovery'
  | 'exit';

export interface AndroidBackState {
  showSplash: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeTab: 'home' | 'chat' | 'memories' | 'settings';
  hasActiveSubscreen: boolean;
  authView: 'none' | 'login' | 'register';
  hasCompletedOnboarding: boolean;
  passwordRecovery: boolean;
}

export function resolveAndroidBackAction(state: AndroidBackState): AndroidBackAction {
  if (state.showSplash || state.isLoading) return 'ignore';
  if (state.passwordRecovery) return 'cancel-password-recovery';

  if (state.isAuthenticated) {
    if (state.hasActiveSubscreen) return 'close-subscreen';
    return state.activeTab === 'home' ? 'exit' : 'show-home';
  }

  if (state.authView === 'register') return 'show-login';
  if (state.authView === 'login') {
    return state.hasCompletedOnboarding ? 'exit' : 'show-onboarding';
  }
  return 'exit';
}