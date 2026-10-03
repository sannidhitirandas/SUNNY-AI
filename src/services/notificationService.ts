import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { LocalNotificationSchema } from '@capacitor/local-notifications';
import {
  type NotificationPreferences,
  normalizeNotificationPreferences,
} from '@/types/notifications';
import {
  createNotificationCoordinator,
  dispatchNotificationTap,
  SUNNY_NOTIFICATION_SOURCE,
  type NativeNotificationAdapter,
} from '@/lib/notificationCoordinator';
import { storageService } from './storageService';

export { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications';

const notificationAdapter: NativeNotificationAdapter = {
  checkPermissions: () => LocalNotifications.checkPermissions(),
  requestPermissions: () => LocalNotifications.requestPermissions(),
  areEnabled: () => LocalNotifications.areEnabled(),
  getPending: async () => {
    const result = await LocalNotifications.getPending();
    return { notifications: result.notifications.map(({ id, extra }) => ({ id, extra })) };
  },
  getTriggered: async () => {
    const result = await LocalNotifications.getAll({ state: 'TRIGGERED' });
    return { notifications: result.notifications.map(({ extra }) => ({ extra })) };
  },
  cancel: async (ids) => {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  },
  schedule: async (notifications) => {
    await LocalNotifications.schedule({ notifications: notifications as LocalNotificationSchema[] });
  },
  createChannel: async (channel) => {
    await LocalNotifications.createChannel(channel);
  },
};

const coordinator = createNotificationCoordinator({
  platform: () => Capacitor.getPlatform(),
  pluginAvailable: () => Capacitor.isPluginAvailable('LocalNotifications'),
  plugin: notificationAdapter,
  storage: storageService,
});

let notificationListeners: Promise<void> | null = null;

const initializeListeners = (): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('LocalNotifications')) {
    return Promise.resolve();
  }
  if (notificationListeners) return notificationListeners;

  notificationListeners = Promise.all([
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      void coordinator.recordDeliveredNotification(notification.extra);
    }),
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const extra = action.notification?.extra;
      if (extra && typeof extra === 'object' && (extra as Record<string, unknown>).source === SUNNY_NOTIFICATION_SOURCE) {
        void coordinator.recordDeliveredNotification(extra);
        dispatchNotificationTap();
      }
    }),
  ]).then(() => undefined).catch((error) => {
    notificationListeners = null;
    console.warn('[notificationService] Could not register Android notification listeners:', error);
  });

  return notificationListeners;
};

export const notificationService = {
  async getLegacyPreferences(): Promise<Partial<NotificationPreferences> | null> {
    const saved = await storageService.getItem<Partial<NotificationPreferences> | null>(
      storageService.KEYS.NOTIFICATION_PREFERENCES,
      null,
    );
    if (!saved) return null;
    const legacyPreferences: Partial<NotificationPreferences> = { ...normalizeNotificationPreferences(saved) };
    if (typeof saved.enabled === 'boolean') legacyPreferences.enabled = saved.enabled;
    else delete legacyPreferences.enabled;
    return legacyPreferences;
  },

  getRuntimeStatus: coordinator.getRuntimeStatus,
  requestPermissionFromUser: coordinator.requestPermissionFromUser,
  syncNotificationSchedule: coordinator.syncNotificationSchedule,
  initializeListeners,
  addNotificationTapListener: coordinator.addNotificationTapListener,
};
