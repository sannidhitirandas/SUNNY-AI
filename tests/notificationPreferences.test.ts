import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_NOTIFICATION_PREFERENCES, isValidClockTime, normalizeNotificationPreferences } from '../src/types/notifications';
import { normalizeUserPreferences } from '../src/types/user';

test('notification settings preserve valid times including overnight quiet hours', () => {
  const preferences = normalizeNotificationPreferences({
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    morningTime: '07:35',
  });

  assert.equal(preferences.quietHoursStart, '22:00');
  assert.equal(preferences.quietHoursEnd, '08:00');
  assert.equal(preferences.morningTime, '07:35');
});

test('invalid clock values and daily limits fall back to safe defaults', () => {
  const preferences = normalizeNotificationPreferences({
    quietHoursStart: '25:99',
    eveningTime: '',
    dailyLimit: 0,
  });

  assert.equal(preferences.quietHoursStart, '22:00');
  assert.equal(preferences.eveningTime, '21:00');
  assert.equal(preferences.dailyLimit, 3);
  assert.equal(isValidClockTime('23:59'), true);
  assert.equal(isValidClockTime('24:00'), false);
});

test('notification limit accepts only integers from one through ten', () => {
  assert.equal(normalizeNotificationPreferences({ dailyLimit: 10 }).dailyLimit, 10);
  assert.equal(normalizeNotificationPreferences({ dailyLimit: 11 }).dailyLimit, 3);
  assert.equal(normalizeNotificationPreferences({ dailyLimit: 2.5 }).dailyLimit, 3);
});

test('user preference normalization synchronizes the notification master switch', () => {
  const preferences = normalizeUserPreferences({
    notificationsEnabled: false,
    notificationPreferences: { enabled: true },
    theme: 'sunny-light',
  });

  assert.equal(preferences.notificationsEnabled, false);
  assert.equal(preferences.notificationPreferences.enabled, false);
  assert.equal(preferences.theme, 'sunny-light');
});

test('new notification preferences default off until the user opts in', () => {
  assert.equal(DEFAULT_NOTIFICATION_PREFERENCES.enabled, false);
});