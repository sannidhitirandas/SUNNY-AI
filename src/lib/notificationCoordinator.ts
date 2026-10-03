import type { PermissionState } from '@capacitor/core';
import {
  normalizeNotificationPreferences,
  type NotificationPreferences,
} from '@/types/notifications';
import {
  normalizeNotificationScheduleLedger,
  getNotificationContent,
  localDateKey,
  planNotificationSchedule,
  type NotificationScheduleLedger,
  type NotificationSlot,
} from './notificationScheduling';

export const NOTIFICATION_PERMISSION_CONSENT_KEY = '@sunny_notification_permission_consent';
export const NOTIFICATION_PERMISSION_REQUESTED_KEY = '@sunny_notification_permission_requested';
export const NOTIFICATION_SCHEDULE_STATE_KEY = '@sunny_notification_schedule_state';
export const SUNNY_NOTIFICATION_SOURCE = 'sunny-ai-local';
export const SUNNY_NOTIFICATION_CHANNEL_ID = 'sunny-ai-check-ins';

export interface NativeScheduleNotification {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date; allowWhileIdle: boolean };
  channelId: string;
  extra: Record<string, unknown>;
  isExactNotification: false;
}

export interface NativeNotificationAdapter {
  checkPermissions: () => Promise<{ display: PermissionState }>;
  requestPermissions: () => Promise<{ display: PermissionState }>;
  areEnabled: () => Promise<{ value: boolean }>;
  getPending: () => Promise<{ notifications: { id: number; extra?: unknown }[] }>;
  getTriggered?: () => Promise<{ notifications: { extra?: unknown }[] }>;
  cancel: (ids: number[]) => Promise<void>;
  schedule: (notifications: NativeScheduleNotification[]) => Promise<void>;
  createChannel?: (channel: { id: string; name: string; description: string; importance: 3 }) => Promise<void>;
}

export interface NotificationStorageAdapter {
  getItem<T>(key: string, defaultValue: T): Promise<T>;
  setItem<T>(key: string, value: T): Promise<boolean>;
}

export interface NotificationRuntimeStatus {
  supported: boolean;
  permission: PermissionState | 'unsupported' | 'unavailable';
  systemEnabled: boolean;
  userConsented: boolean;
  permissionRequested: boolean;
  scheduledCount: number;
}

export interface NotificationCoordinatorOptions {
  platform: () => string;
  pluginAvailable: () => boolean;
  plugin: NativeNotificationAdapter;
  storage: NotificationStorageAdapter;
  now?: () => Date;
  timezone?: () => string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isSlot = (value: unknown): value is NotificationSlot =>
  value === 'morning' || value === 'afternoon' || value === 'evening';

const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

export const createNotificationCoordinator = ({
  platform,
  pluginAvailable,
  plugin,
  storage,
  now = () => new Date(),
  timezone = getTimezone,
}: NotificationCoordinatorOptions) => {
  let operation = Promise.resolve();

  const isAvailable = () => platform() === 'android' && pluginAvailable();
  const enqueue = <T,>(callback: () => Promise<T>): Promise<T> => {
    const current = operation.then(callback, callback);
    operation = current.then(() => undefined, () => undefined);
    return current;
  };

  const getSunnyPending = async () => {
    const result = await plugin.getPending();
    return result.notifications.filter((notification) =>
      isObject(notification.extra) && notification.extra.source === SUNNY_NOTIFICATION_SOURCE,
    );
  };

  const cancelSunnyPending = async () => {
    const pending = await getSunnyPending();
    if (pending.length > 0) await plugin.cancel(pending.map((notification) => notification.id));
  };

  const getLedger = async (): Promise<NotificationScheduleLedger | null> => {
    const saved = await storage.getItem<unknown>(NOTIFICATION_SCHEDULE_STATE_KEY, null);
    return normalizeNotificationScheduleLedger(saved);
  };

  const getRuntimeStatus = async (): Promise<NotificationRuntimeStatus> => {
    if (!isAvailable()) {
      return {
        supported: false,
        permission: platform() === 'android' ? 'unavailable' : 'unsupported',
        systemEnabled: false,
        userConsented: await storage.getItem(NOTIFICATION_PERMISSION_CONSENT_KEY, false),
        permissionRequested: await storage.getItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, false),
        scheduledCount: 0,
      };
    }

    try {
      const [permission, enabled, consented, permissionRequested, pending] = await Promise.all([
        plugin.checkPermissions(),
        plugin.areEnabled(),
        storage.getItem(NOTIFICATION_PERMISSION_CONSENT_KEY, false),
        storage.getItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, false),
        getSunnyPending(),
      ]);
      return {
        supported: true,
        permission: permission.display,
        systemEnabled: enabled.value,
        userConsented: consented,
        permissionRequested,
        scheduledCount: pending.length,
      };
    } catch {
      return {
        supported: true,
        permission: 'unavailable',
        systemEnabled: false,
        userConsented: await storage.getItem(NOTIFICATION_PERMISSION_CONSENT_KEY, false),
        permissionRequested: await storage.getItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, false),
        scheduledCount: 0,
      };
    }
  };

  const requestPermissionFromUser = () => enqueue(async (): Promise<NotificationRuntimeStatus> => {
    if (!isAvailable()) return getRuntimeStatus();

    const currentPermission = await plugin.checkPermissions();
    const alreadyConsented = await storage.getItem(NOTIFICATION_PERMISSION_CONSENT_KEY, false);
    if (currentPermission.display === 'granted') {
      const enabled = await plugin.areEnabled();
      if (enabled.value) {
        await storage.setItem(NOTIFICATION_PERMISSION_CONSENT_KEY, true);
        return getRuntimeStatus();
      }
      return getRuntimeStatus();
    }

    const permissionWasRequested = await storage.getItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, false);
    if (currentPermission.display === 'denied' || permissionWasRequested) {
      if (alreadyConsented) await storage.setItem(NOTIFICATION_PERMISSION_CONSENT_KEY, false);
      return getRuntimeStatus();
    }

    const requested = await plugin.requestPermissions();
    await storage.setItem(NOTIFICATION_PERMISSION_REQUESTED_KEY, true);
    const systemStatus = requested.display === 'granted' ? await plugin.areEnabled() : { value: false };
    const granted = requested.display === 'granted' && systemStatus.value;
    await storage.setItem(NOTIFICATION_PERMISSION_CONSENT_KEY, granted);
    return getRuntimeStatus();
  });

  const syncNotificationSchedule = (value: NotificationPreferences) => enqueue(async () => {
    if (!isAvailable()) return getRuntimeStatus();

    const preferences = normalizeNotificationPreferences(value);
    if (!preferences.enabled) {
      await cancelSunnyPending();
      return getRuntimeStatus();
    }

    const [permission, systemEnabled, consented] = await Promise.all([
      plugin.checkPermissions(),
      plugin.areEnabled(),
      storage.getItem(NOTIFICATION_PERMISSION_CONSENT_KEY, false),
    ]);
    if (permission.display !== 'granted' || !systemEnabled.value || !consented) {
      await cancelSunnyPending();
      return getRuntimeStatus();
    }

    await plugin.createChannel?.({
      id: SUNNY_NOTIFICATION_CHANNEL_ID,
      name: 'Sunny AI check-ins',
      description: 'Gentle reminders scheduled by you in Sunny settings.',
      importance: 3,
    });

    const currentTimezone = timezone();
    const triggered = await plugin.getTriggered?.();
    for (const delivered of triggered?.notifications ?? []) {
      await recordDeliveredNotification(delivered.extra);
    }
    const ledger = await getLedger();
    const plan = planNotificationSchedule(preferences, now(), ledger, currentTimezone);
    await cancelSunnyPending();

    // Save quota reservations before native scheduling so a process death cannot reset today's cap.
    await storage.setItem(NOTIFICATION_SCHEDULE_STATE_KEY, plan.ledger);
    if (plan.notifications.length > 0) {
      await plugin.schedule(plan.notifications.map((occurrence) => ({
        id: occurrence.id,
        title: getNotificationContent(occurrence.slot, occurrence.dateKey).title,
        body: getNotificationContent(occurrence.slot, occurrence.dateKey).body,
        schedule: { at: occurrence.at, allowWhileIdle: true },
        channelId: SUNNY_NOTIFICATION_CHANNEL_ID,
        extra: {
          source: SUNNY_NOTIFICATION_SOURCE,
          slot: occurrence.slot,
          dateKey: occurrence.dateKey,
          sourceDateKey: occurrence.sourceDateKey,
          time: occurrence.time,
        },
        isExactNotification: false,
      })));
    }

    return getRuntimeStatus();
  });

  const recordDeliveredNotification = async (extra: unknown) => {
    if (!isObject(extra) || extra.source !== SUNNY_NOTIFICATION_SOURCE || !isSlot(extra.slot)) return;
    if (typeof extra.dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(extra.dateKey)) return;

    const currentTimezone = timezone();
    const saved = normalizeNotificationScheduleLedger(
      await storage.getItem<unknown>(NOTIFICATION_SCHEDULE_STATE_KEY, null),
    );
    if (!saved) return;
    const todayKey = localDateKey(now());
    let ledger = saved;
    if (saved.timezone !== currentTimezone) {
      if (extra.dateKey !== todayKey) return;
      ledger = {
        timezone: currentTimezone,
        dates: {
          [todayKey]: {
            reservations: {},
            sources: {},
            deliveredSlots: saved.dates[todayKey]?.deliveredSlots ?? [],
          },
        },
      };
    }
    const date = ledger.dates[extra.dateKey] ?? (extra.dateKey === todayKey
      ? { reservations: {}, sources: {}, deliveredSlots: [] }
      : null);
    if (!date) return;
    ledger.dates[extra.dateKey] = date;
    if (typeof extra.time === 'string') date.reservations[extra.slot] ??= extra.time;
    if (typeof extra.sourceDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(extra.sourceDateKey)) {
      date.sources[extra.slot] = extra.sourceDateKey;
    }
    if (!date.deliveredSlots.includes(extra.slot)) date.deliveredSlots.push(extra.slot);
    await storage.setItem(NOTIFICATION_SCHEDULE_STATE_KEY, ledger);
  };

  const addNotificationTapListener = (listener: () => void) => {
    tapListeners.add(listener);
    if (hasPendingTap) {
      hasPendingTap = false;
      listener();
    }
    return () => {
      tapListeners.delete(listener);
    };
  };

  return {
    getRuntimeStatus,
    requestPermissionFromUser,
    syncNotificationSchedule,
    recordDeliveredNotification,
    addNotificationTapListener,
  };
};

const tapListeners = new Set<() => void>();
let hasPendingTap = false;

export const dispatchNotificationTap = () => {
  if (tapListeners.size === 0) {
    hasPendingTap = true;
    return;
  }
  for (const listener of tapListeners) listener();
};
