import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNotificationCoordinator,
  dispatchNotificationTap,
  type NativeNotificationAdapter,
  type NativeScheduleNotification,
} from '../src/lib/notificationCoordinator';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/types/notifications';

const localNow = () => new Date(2026, 9, 3, 6, 0, 0, 0);
const prefs = (updates: Partial<typeof DEFAULT_NOTIFICATION_PREFERENCES> = {}) => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  enabled: true,
  morningTime: '09:00',
  afternoonTime: '15:00',
  eveningTime: '21:00',
  ...updates,
});

const createHarness = (options: { platform?: string; permission?: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' } = {}) => {
  const values = new Map<string, unknown>();
  let permission = options.permission ?? 'prompt';
  let systemEnabled = permission === 'granted';
  let requestCount = 0;
  let pending: NativeScheduleNotification[] = [];

  const plugin: NativeNotificationAdapter = {
    checkPermissions: async () => ({ display: permission }),
    requestPermissions: async () => {
      requestCount += 1;
      permission = permission === 'prompt' || permission === 'prompt-with-rationale' ? 'denied' : permission;
      systemEnabled = permission === 'granted';
      return { display: permission };
    },
    areEnabled: async () => ({ value: systemEnabled }),
    getPending: async () => ({ notifications: pending.map(({ id, extra }) => ({ id, extra })) }),
    cancel: async (ids) => {
      pending = pending.filter((item) => !ids.includes(item.id));
    },
    schedule: async (notifications) => {
      pending = [...pending, ...notifications];
    },
    createChannel: async () => undefined,
  };

  const coordinator = createNotificationCoordinator({
    platform: () => options.platform ?? 'android',
    pluginAvailable: () => true,
    plugin,
    storage: {
      async getItem<T>(key: string, defaultValue: T): Promise<T> {
        return values.has(key) ? values.get(key) as T : defaultValue;
      },
      async setItem<T>(key: string, value: T): Promise<boolean> {
        values.set(key, value);
        return true;
      },
    },
    now: localNow,
    timezone: () => 'Test/Local',
  });

  return {
    coordinator,
    get pending() { return pending; },
    get requestCount() { return requestCount; },
    set permission(value: typeof permission) {
      permission = value;
      systemEnabled = value === 'granted';
    },
  };
};

test('permission denial never schedules notifications or repeats the Android prompt', async () => {
  const harness = createHarness();
  harness.permission = 'prompt';
  const first = await harness.coordinator.requestPermissionFromUser();
  assert.equal(first.permission, 'denied');
  assert.equal(harness.requestCount, 1);

  await harness.coordinator.syncNotificationSchedule(prefs());
  const second = await harness.coordinator.requestPermissionFromUser();
  assert.equal(second.permission, 'denied');
  assert.equal(harness.requestCount, 1);
  assert.equal(harness.pending.length, 0);
});

test('granted permission plus explicit opt-in schedules notifications natively', async () => {
  const harness = createHarness({ permission: 'granted' });
  const status = await harness.coordinator.requestPermissionFromUser();
  assert.equal(status.userConsented, true);

  await harness.coordinator.syncNotificationSchedule(prefs({ dailyLimit: 2 }));
  assert.equal(harness.pending.length, 30 * 2);
  assert.ok(harness.pending.every((item) => item.isExactNotification === false));
  assert.ok(harness.pending.every((item) => item.extra.source === 'sunny-ai-local'));
});

test('time changes replace existing IDs instead of duplicating notifications', async () => {
  const harness = createHarness({ permission: 'granted' });
  await harness.coordinator.requestPermissionFromUser();
  await harness.coordinator.syncNotificationSchedule(prefs());
  const morningId = harness.pending.find((item) => item.extra.slot === 'morning')?.id;

  await harness.coordinator.syncNotificationSchedule(prefs({ morningTime: '10:30' }));
  const morningNotifications = harness.pending.filter((item) => item.extra.slot === 'morning');
  assert.equal(morningNotifications[0].id, morningId);
  assert.equal(morningNotifications.length, 30);
  assert.equal(morningNotifications[0].schedule.at.getHours(), 10);
  assert.equal(morningNotifications[0].schedule.at.getMinutes(), 30);
  assert.equal(new Set(harness.pending.map((item) => item.id)).size, harness.pending.length);
});

test('disabling notifications cancels Sunny schedules only', async () => {
  const harness = createHarness({ permission: 'granted' });
  await harness.coordinator.requestPermissionFromUser();
  await harness.coordinator.syncNotificationSchedule(prefs());
  await harness.coordinator.syncNotificationSchedule(prefs({ enabled: false }));
  assert.equal(harness.pending.length, 0);
});

test('web and unavailable plugin environments safely no-op', async () => {
  const web = createHarness({ platform: 'web' });
  assert.equal((await web.coordinator.getRuntimeStatus()).permission, 'unsupported');
  await web.coordinator.requestPermissionFromUser();
  await web.coordinator.syncNotificationSchedule(prefs());
  assert.equal(web.requestCount, 0);
  assert.equal(web.pending.length, 0);
});

test('already granted Android permission is not requested again', async () => {
  const harness = createHarness({ permission: 'granted' });
  const status = await harness.coordinator.requestPermissionFromUser();
  await harness.coordinator.syncNotificationSchedule(prefs());
  assert.equal(status.permission, 'granted');
  assert.equal(harness.requestCount, 0);
});

test('existing Android permission does not schedule until Sunny receives explicit opt-in', async () => {
  const harness = createHarness({ permission: 'granted' });
  await harness.coordinator.syncNotificationSchedule(prefs());
  assert.equal(harness.pending.length, 0);
  assert.equal(harness.requestCount, 0);

  await harness.coordinator.requestPermissionFromUser();
  await harness.coordinator.syncNotificationSchedule(prefs());
  assert.equal(harness.pending.length, 30 * 3);
});

test('a triggered notification remains charged against its local-day limit after re-sync', async () => {
  const harness = createHarness({ permission: 'granted' });
  await harness.coordinator.requestPermissionFromUser();
  await harness.coordinator.syncNotificationSchedule(prefs({ dailyLimit: 1 }));
  const todaysMorning = harness.pending.find((item) => item.extra.dateKey === '2026-10-03');
  assert.ok(todaysMorning);

  await harness.coordinator.recordDeliveredNotification(todaysMorning.extra);
  await harness.coordinator.syncNotificationSchedule(prefs({ dailyLimit: 1, morningTime: '10:30' }));

  assert.equal(harness.pending.some((item) => item.extra.dateKey === '2026-10-03'), false);
});

test('lowering the daily limit cancels excess pending notifications', async () => {
  const harness = createHarness({ permission: 'granted' });
  await harness.coordinator.requestPermissionFromUser();
  await harness.coordinator.syncNotificationSchedule(prefs({ dailyLimit: 3 }));
  assert.equal(harness.pending.length, 30 * 3);

  await harness.coordinator.syncNotificationSchedule(prefs({ dailyLimit: 1 }));
  assert.equal(harness.pending.length, 30);
  for (const dateKey of new Set(harness.pending.map((item) => item.extra.dateKey))) {
    assert.equal(harness.pending.filter((item) => item.extra.dateKey === dateKey).length, 1);
  }
});

test('notification taps are retained until the app navigation listener subscribes', () => {
  let opened = 0;
  dispatchNotificationTap();
  const remove = createHarness().coordinator.addNotificationTapListener(() => {
    opened += 1;
  });
  assert.equal(opened, 1);
  remove();
});