import assert from 'node:assert/strict';
import test from 'node:test';
import { isWithinQuietHours, planNotificationSchedule } from '../src/lib/notificationScheduling';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/types/notifications';

const localDate = (hours: number, minutes = 0, day = 3) => new Date(2026, 9, day, hours, minutes, 0, 0);
const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

const preferences = (updates: Partial<typeof DEFAULT_NOTIFICATION_PREFERENCES> = {}) => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  enabled: true,
  morningTime: '09:00',
  afternoonTime: '15:00',
  eveningTime: '21:00',
  ...updates,
});

test('disabled preferences create no native occurrences', () => {
  const plan = planNotificationSchedule(preferences({ enabled: false }), localDate(6), null, localTimezone, 1);
  assert.equal(plan.notifications.length, 0);
});

test('enabled preferences schedule the configured morning, afternoon, and evening times', () => {
  const plan = planNotificationSchedule(preferences(), localDate(6), null, localTimezone, 1);
  assert.deepEqual(plan.notifications.map(({ slot, time }) => [slot, time]), [
    ['morning', '09:00'],
    ['afternoon', '15:00'],
    ['evening', '21:00'],
  ]);
});

test('changing each saved slot time updates its scheduled local occurrence', () => {
  for (const [slot, timeKey, replacement] of [
    ['morning', 'morningTime', '10:20'],
    ['afternoon', 'afternoonTime', '16:25'],
    ['evening', 'eveningTime', '20:40'],
  ] as const) {
    const updated = preferences({ [timeKey]: replacement });
    const plan = planNotificationSchedule(updated, localDate(6), null, localTimezone, 1);
    assert.equal(plan.notifications.find((item) => item.slot === slot)?.time, replacement);
  }
});

test('quiet hours defer overnight and daytime slots to the exclusive end boundary', () => {
  assert.equal(isWithinQuietHours('22:00', '22:00', '08:00'), true);
  assert.equal(isWithinQuietHours('07:59', '22:00', '08:00'), true);
  assert.equal(isWithinQuietHours('08:00', '22:00', '08:00'), false);
  assert.equal(isWithinQuietHours('13:00', '13:00', '14:00'), true);
  assert.equal(isWithinQuietHours('14:00', '13:00', '14:00'), false);

  const overnightPlan = planNotificationSchedule(
    preferences({ morningTime: '07:30', quietHoursStart: '22:00', quietHoursEnd: '08:00' }),
    localDate(6), null, localTimezone, 1,
  );
  const deferredMorning = overnightPlan.notifications.find((item) => item.slot === 'morning');
  assert.equal(deferredMorning?.time, '08:00');
  assert.equal(isWithinQuietHours(deferredMorning!.time, '22:00', '08:00'), false);

  const daytimePlan = planNotificationSchedule(
    preferences({ afternoonTime: '13:30', quietHoursStart: '13:00', quietHoursEnd: '14:00' }),
    localDate(6), null, localTimezone, 1,
  );
  const deferredAfternoon = daytimePlan.notifications.find((item) => item.slot === 'afternoon');
  assert.equal(deferredAfternoon?.time, '14:00');
  assert.equal(isWithinQuietHours(deferredAfternoon!.time, '13:00', '14:00'), false);
});

test('late-night quiet-hour deferrals roll over midnight and remain idempotent', () => {
  const values = preferences({
    morningEnabled: false,
    afternoonEnabled: false,
    eveningTime: '23:00',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const first = planNotificationSchedule(values, localDate(6), null, localTimezone, 2);
  const deferred = first.notifications.find((item) => item.sourceDateKey === '2026-10-02');
  assert.equal(deferred?.dateKey, '2026-10-03');
  assert.equal(deferred?.time, '08:00');

  const repeated = planNotificationSchedule(values, localDate(6), first.ledger, localTimezone, 2);
  assert.deepEqual(
    repeated.notifications.map((item) => item.id),
    first.notifications.map((item) => item.id),
  );
});

test('equal quiet-hour boundaries mean no quiet period', () => {
  assert.equal(isWithinQuietHours('12:00', '22:00', '22:00'), false);
  const plan = planNotificationSchedule(
    preferences({ quietHoursStart: '22:00', quietHoursEnd: '22:00' }),
    localDate(6), null, localTimezone, 1,
  );
  assert.equal(plan.notifications.length, 3);
});

test('daily limit caps slots and lowering it preserves consumed reservations', () => {
  const first = planNotificationSchedule(preferences({ dailyLimit: 2 }), localDate(6), null, localTimezone, 1);
  assert.equal(first.notifications.length, 2);

  const lowered = planNotificationSchedule(
    preferences({ dailyLimit: 1 }),
    localDate(10),
    first.ledger,
    localTimezone,
    1,
  );
  assert.equal(lowered.notifications.length, 0);

  const future = planNotificationSchedule(
    preferences({ dailyLimit: 1 }),
    localDate(6, 0, 4),
    lowered.ledger,
    localTimezone,
    1,
  );
  assert.equal(future.notifications.length, 1);
});

test('same-time slots are deduplicated and repeated planning is idempotent', () => {
  const sameTimes = preferences({ morningTime: '12:00', afternoonTime: '12:00', eveningTime: '12:00' });
  const first = planNotificationSchedule(sameTimes, localDate(6), null, localTimezone, 1);
  const again = planNotificationSchedule(sameTimes, localDate(6), first.ledger, localTimezone, 1);

  assert.equal(first.notifications.length, 1);
  assert.deepEqual(again.notifications.map((item) => item.id), first.notifications.map((item) => item.id));
  assert.equal(new Set(again.notifications.map((item) => item.id)).size, again.notifications.length);
});

test('midnight boundaries use the next local calendar date', () => {
  const plan = planNotificationSchedule(
    preferences({ morningTime: '00:00', morningEnabled: true, afternoonEnabled: false, eveningEnabled: false, quietHoursEnabled: false }),
    localDate(23, 55, 3), null, localTimezone, 2,
  );
  assert.equal(plan.notifications.length, 1);
  assert.equal(plan.notifications[0].dateKey, `2026-10-04`);
  assert.equal(plan.notifications[0].at.getHours(), 0);
});

test('invalid preference values normalize before planning', () => {
  const plan = planNotificationSchedule(
    preferences({ dailyLimit: 0, morningTime: '99:99', quietHoursStart: 'bad' }),
    localDate(6), null, localTimezone, 1,
  );
  assert.equal(plan.notifications.length, 3);
  assert.equal(plan.notifications[0].time, '09:00');
});