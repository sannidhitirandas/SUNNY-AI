import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAppRoute } from '../src/lib/authRouting';
import {
  classifySignUpResult,
  isValidEmailAddress,
  validateLoginFields,
  validateRegistrationFields,
} from '../src/lib/authValidation';

const baseState = {
  authLoading: false,
  preferencesLoading: false,
  passwordRecovery: false,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  authView: 'none' as const,
};

test('does not resolve to the application while auth is loading', () => {
  assert.equal(resolveAppRoute({ ...baseState, authLoading: true, isAuthenticated: true }), 'loading');
});

test('shows onboarding to first-time signed-out users', () => {
  assert.equal(resolveAppRoute(baseState), 'onboarding');
});

test('requires login after onboarding is complete', () => {
  assert.equal(resolveAppRoute({ ...baseState, hasCompletedOnboarding: true }), 'login');
});

test('keeps explicit login and registration screens signed out', () => {
  assert.equal(resolveAppRoute({ ...baseState, authView: 'login' }), 'login');
  assert.equal(resolveAppRoute({ ...baseState, authView: 'register' }), 'register');
});

test('shows the app only for an authenticated user', () => {
  assert.equal(resolveAppRoute({ ...baseState, isAuthenticated: true }), 'application');
});

test('routes recovery links to password update even with a session', () => {
  assert.equal(resolveAppRoute({ ...baseState, isAuthenticated: true, passwordRecovery: true }), 'recovery');
});

test('validates email addresses used by login and registration', () => {
  assert.equal(isValidEmailAddress('sunny@example.com'), true);
  assert.equal(isValidEmailAddress('  sunny@example.com  '), true);
  assert.equal(isValidEmailAddress('not-an-email'), false);
  assert.equal(isValidEmailAddress('sunny@'), false);
});

test('validates empty login and registration fields and matching passwords', () => {
  assert.equal(validateLoginFields('', ''), 'Please fill in both your email and password.');
  assert.equal(validateLoginFields('bad-email', 'secret'), 'Please enter a valid email address.');
  assert.equal(validateRegistrationFields({ name: '', email: '', password: '', confirmPassword: '' }), 'Please enter your preferred name or nickname.');
  assert.equal(validateRegistrationFields({ name: 'Sunny', email: 'sunny@example.com', password: '123456', confirmPassword: '654321' }), 'Passwords do not match.');
  assert.equal(validateRegistrationFields({ name: 'Sunny', email: 'sunny@example.com', password: '123456', confirmPassword: '123456' }), null);
});

test('does not mistake an unconfirmed signup response for an authenticated session', () => {
  assert.equal(classifySignUpResult(false, 1), 'confirmation-required');
  assert.equal(classifySignUpResult(true, 0), 'authenticated');
  assert.equal(classifySignUpResult(false, 0), 'duplicate');
});