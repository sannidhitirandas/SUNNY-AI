import {
  isValidClockTime,
  normalizeNotificationPreferences,
  type NotificationPreferences,
} from '@/types/notifications';

export const NOTIFICATION_SCHEDULE_HORIZON_DAYS = 30;

export type NotificationSlot = 'morning' | 'afternoon' | 'evening';

export interface NotificationDateReservation {
  reservations: Partial<Record<NotificationSlot, string>>;
  sources: Partial<Record<NotificationSlot, string>>;
  deliveredSlots: NotificationSlot[];
}

export interface NotificationScheduleLedger {
  timezone: string;
  dates: Record<string, NotificationDateReservation>;
}

export interface PlannedLocalNotification {
  id: number;
  dateKey: string;
  sourceDateKey: string;
  slot: NotificationSlot;
  time: string;
  at: Date;
}

export interface NotificationSchedulePlan {
  notifications: PlannedLocalNotification[];
  ledger: NotificationScheduleLedger;
}

const SLOT_DEFINITIONS: {
  slot: NotificationSlot;
  timeKey: 'morningTime' | 'afternoonTime' | 'eveningTime';
  enabledKey: 'morningEnabled' | 'afternoonEnabled' | 'eveningEnabled';
  index: number;
}[] = [
  { slot: 'morning', timeKey: 'morningTime', enabledKey: 'morningEnabled', index: 1 },
  { slot: 'afternoon', timeKey: 'afternoonTime', enabledKey: 'afternoonEnabled', index: 2 },
  { slot: 'evening', timeKey: 'eveningTime', enabledKey: 'eveningEnabled', index: 3 },
];

const pad = (value: number) => String(value).padStart(2, '0');

export const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const localDateAtOffset = (date: Date, offset: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);

const minutesOfDay = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isWithinQuietHours = (
  time: string,
  quietHoursStart: string,
  quietHoursEnd: string,
  quietHoursEnabled = true,
): boolean => {
  if (!quietHoursEnabled || !isValidClockTime(time) || !isValidClockTime(quietHoursStart) || !isValidClockTime(quietHoursEnd)) {
    return false;
  }

  const current = minutesOfDay(time);
  const start = minutesOfDay(quietHoursStart);
  const end = minutesOfDay(quietHoursEnd);

  // Equal boundaries represent a zero-length quiet period, not a full day.
  if (start === end) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
};

const notificationId = (dateKey: string, slotIndex: number): number =>
  Number(dateKey.replace(/-/g, '')) * 10 + slotIndex;

const normalizeDateReservation = (value: unknown): NotificationDateReservation => {
  if (!value || typeof value !== 'object') return { reservations: {}, sources: {}, deliveredSlots: [] };
  const candidate = value as Partial<NotificationDateReservation>;
  const reservations: Partial<Record<NotificationSlot, string>> = {};
  const sources: Partial<Record<NotificationSlot, string>> = {};
  for (const { slot } of SLOT_DEFINITIONS) {
    if (isValidClockTime(candidate.reservations?.[slot])) {
      reservations[slot] = candidate.reservations[slot];
    }
    if (typeof candidate.sources?.[slot] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate.sources[slot]!)) {
      sources[slot] = candidate.sources[slot];
    }
  }
  const deliveredSlots = Array.isArray(candidate.deliveredSlots)
    ? candidate.deliveredSlots.filter((slot): slot is NotificationSlot => SLOT_DEFINITIONS.some((item) => item.slot === slot))
    : [];
  return { reservations, sources, deliveredSlots: [...new Set(deliveredSlots)] };
};

export const normalizeNotificationScheduleLedger = (value: unknown): NotificationScheduleLedger | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<NotificationScheduleLedger>;
  if (typeof candidate.timezone !== 'string' || !candidate.dates || typeof candidate.dates !== 'object') return null;
  const dates: Record<string, NotificationDateReservation> = {};
  for (const [dateKey, reservation] of Object.entries(candidate.dates)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) dates[dateKey] = normalizeDateReservation(reservation);
  }
  return { timezone: candidate.timezone, dates };
};

export const planNotificationSchedule = (
  value: NotificationPreferences,
  now: Date,
  existingLedger: NotificationScheduleLedger | null,
  timezone: string,
  horizonDays = NOTIFICATION_SCHEDULE_HORIZON_DAYS,
): NotificationSchedulePlan => {
  const preferences = normalizeNotificationPreferences(value);
  const sameTimezone = existingLedger?.timezone === timezone;
  const priorLedger = sameTimezone ? existingLedger : null;
  const todayKey = localDateKey(now);
  const dates: Record<string, NotificationDateReservation> = {};
  const notifications: PlannedLocalNotification[] = [];
  const horizon = Math.max(1, Math.floor(horizonDays));
  const candidatesByDate = new Map<string, {
    slot: NotificationSlot;
    time: string;
    at: Date;
    index: number;
    sourceDateKey: string;
  }[]>();

  if (preferences.enabled) {
    for (let sourceOffset = -1; sourceOffset < horizon; sourceOffset += 1) {
      const sourceDate = localDateAtOffset(now, sourceOffset);
      const sourceDateKey = localDateKey(sourceDate);
      for (const { slot, timeKey, enabledKey, index } of SLOT_DEFINITIONS) {
        const configuredTime = preferences[timeKey];
        if (!preferences[enabledKey]) continue;

        let scheduledDate = sourceDate;
        let scheduledTime = configuredTime;
        if (isWithinQuietHours(
          configuredTime,
          preferences.quietHoursStart,
          preferences.quietHoursEnd,
          preferences.quietHoursEnabled,
        )) {
          const start = minutesOfDay(preferences.quietHoursStart);
          const end = minutesOfDay(preferences.quietHoursEnd);
          const configuredMinute = minutesOfDay(configuredTime);
          if (start > end && configuredMinute >= start) {
            scheduledDate = localDateAtOffset(sourceDate, 1);
          }
          scheduledTime = preferences.quietHoursEnd;
        }

        const scheduledDateKey = localDateKey(scheduledDate);
        const targetOffset = Math.round(
          (Date.UTC(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate()) -
            Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000,
        );
        if (targetOffset < 0 || targetOffset >= horizon) continue;

        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const at = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate(), hours, minutes, 0, 0);
        if (at <= now) continue;

        const candidates = candidatesByDate.get(scheduledDateKey) ?? [];
        candidates.push({ slot, time: scheduledTime, at, index, sourceDateKey });
        candidatesByDate.set(scheduledDateKey, candidates);
      }
    }
  }

  for (let offset = 0; offset < horizon; offset += 1) {
    const localDate = localDateAtOffset(now, offset);
    const dateKey = localDateKey(localDate);
    const priorDay = dateKey === todayKey
      ? sameTimezone
        ? normalizeDateReservation(priorLedger?.dates[dateKey])
        : { reservations: {}, sources: {}, deliveredSlots: normalizeDateReservation(existingLedger?.dates[dateKey]).deliveredSlots }
      : { reservations: {}, sources: {}, deliveredSlots: [] };
    const consumed = new Map<NotificationSlot, string>();

    if (dateKey === todayKey) {
      for (const slot of priorDay.deliveredSlots) {
        consumed.set(slot, priorDay.reservations[slot] ?? '00:00');
      }
      const currentMinute = now.getHours() * 60 + now.getMinutes();
      for (const { slot } of SLOT_DEFINITIONS) {
        const reservedTime = priorDay.reservations[slot];
        if (reservedTime && minutesOfDay(reservedTime) <= currentMinute) {
          consumed.set(slot, reservedTime);
        }
      }
    }

    const candidates = (candidatesByDate.get(dateKey) ?? []).filter((candidate) => !consumed.has(candidate.slot));
    candidates.sort((left, right) => left.at.getTime() - right.at.getTime() || left.index - right.index);
    const selectedSlots = new Set<NotificationSlot>();
    const selectedTimes = new Set<number>();
    const uniqueCandidates = candidates.filter((candidate) => {
      if (selectedSlots.has(candidate.slot) || selectedTimes.has(candidate.at.getTime())) return false;
      selectedSlots.add(candidate.slot);
      selectedTimes.add(candidate.at.getTime());
      return true;
    });
    const capacity = Math.max(0, preferences.dailyLimit - consumed.size);
    const selected = uniqueCandidates.slice(0, capacity);
    const reservations: Partial<Record<NotificationSlot, string>> = Object.fromEntries(consumed) as Partial<Record<NotificationSlot, string>>;
    const sources: Partial<Record<NotificationSlot, string>> = {};

    for (const occurrence of selected) {
      reservations[occurrence.slot] = occurrence.time;
      sources[occurrence.slot] = occurrence.sourceDateKey;
      notifications.push({
        id: notificationId(dateKey, occurrence.index),
        dateKey,
        sourceDateKey: occurrence.sourceDateKey,
        slot: occurrence.slot,
        time: occurrence.time,
        at: occurrence.at,
      });
    }

    dates[dateKey] = {
      reservations,
      sources: { ...priorDay.sources, ...sources },
      deliveredSlots: dateKey === todayKey ? priorDay.deliveredSlots : [],
    };
  }

  return {
    notifications,
    ledger: { timezone, dates },
  };
};

const CONTENT: Record<NotificationSlot, string[]> = {
  morning: [
    'A gentle start: what would you like to make space for today?',
    'Good morning. Take a breath and ease into the day at your own pace.',
    'A little morning check-in: how are you feeling as today begins?',
    'Wishing you a steady start. What is one small thing ahead today?',
    'Morning, sunshine. Remember, you can take today one step at a time.',
  ],
  afternoon: [
    'Midday pause: take a moment to check in with yourself.',
    'How is your day unfolding? There is room for a small reset.',
    'A gentle afternoon reminder to unclench your shoulders and breathe.',
    'Take a little breathing space. What do you need for the rest of today?',
    'A quick check-in: even a short pause can help you reset.',
  ],
  evening: [
    'As the day winds down, take a moment to notice what went okay.',
    'Evening check-in: you can let the day settle and take a slow breath.',
    'Before the day ends, give yourself a little space to reflect.',
    'The day is nearly done. What would feel kind to yourself tonight?',
    'A quiet moment for you: set down what can wait until tomorrow.',
  ],
};

const dayOfYear = (dateKey: string): number => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dateUtc = Date.UTC(year, month - 1, day);
  const yearStartUtc = Date.UTC(year, 0, 1);
  return Math.floor((dateUtc - yearStartUtc) / 86_400_000) + 1;
};

export const getNotificationContent = (slot: NotificationSlot, dateKey: string): { title: string; body: string } => {
  const messages = CONTENT[slot];
  const messageIndex = (dayOfYear(dateKey) - 1) % messages.length;
  return { title: 'Sunny AI', body: messages[messageIndex] };
};