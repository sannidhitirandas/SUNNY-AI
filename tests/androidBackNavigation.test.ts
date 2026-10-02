import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAndroidBackAction, type AndroidBackState } from '../src/lib/androidBackNavigation';

const baseState: AndroidBackState = {
  showSplash: false,
  isLoading: false,
  isAuthenticated: true,
  activeTab: 'home',
  hasActiveSubscreen: false,
  authView: 'none',
  hasCompletedOnboarding: true,
  passwordRecovery: false,
};

test('Back from each non-home tab returns home', () => {
  for (const activeTab of ['chat', 'memories', 'settings'] as const) {
    assert.equal(resolveAndroidBackAction({ ...baseState, activeTab }), 'show-home');
  }
});

test('Back from Home exits the app', () => {
  assert.equal(resolveAndroidBackAction(baseState), 'exit');
});

test('Back from a protected sub-screen closes it before leaving its tab', () => {
  assert.equal(
    resolveAndroidBackAction({ ...baseState, activeTab: 'settings', hasActiveSubscreen: true }),
    'close-subscreen'
  );
});

test('Back does not expose protected content while auth or splash is loading', () => {
  assert.equal(resolveAndroidBackAction({ ...baseState, showSplash: true }), 'ignore');
  assert.equal(resolveAndroidBackAction({ ...baseState, isLoading: true }), 'ignore');
  assert.equal(resolveAndroidBackAction({ ...baseState, isAuthenticated: false, authView: 'none' }), 'exit');
});

test('Back follows registration, login, onboarding, and recovery hierarchy', () => {
  assert.equal(resolveAndroidBackAction({ ...baseState, isAuthenticated: false, authView: 'register' }), 'show-login');
  assert.equal(resolveAndroidBackAction({ ...baseState, isAuthenticated: false, authView: 'login', hasCompletedOnboarding: false }), 'show-onboarding');
  assert.equal(resolveAndroidBackAction({ ...baseState, isAuthenticated: false, authView: 'login', hasCompletedOnboarding: true }), 'exit');
  assert.equal(resolveAndroidBackAction({ ...baseState, passwordRecovery: true }), 'cancel-password-recovery');
});