import React, { useEffect, useState } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import {
  notificationService,
} from '@/services/notificationService';
import { isValidClockTime, NotificationPreferences } from '@/types/notifications';
import { getNotificationContent, localDateKey, type NotificationSlot } from '@/lib/notificationScheduling';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { Badge } from '@/components/ui/Badge';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { ArrowLeft, Info, Bell, Sun, Heart, Moon, Bookmark, Gauge, VolumeX } from 'lucide-react';
import type { NotificationRuntimeStatus } from '@/lib/notificationCoordinator';

interface NotificationPreferencesScreenProps {
  onBack: () => void;
}

export const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({ onBack }) => {
  const { preferences, updateNotificationPreferences } = usePreferences();
  const prefs = preferences.notificationPreferences;
  const [runtimeStatus, setRuntimeStatus] = useState<NotificationRuntimeStatus | null>(null);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const updateSetting = async <K extends keyof NotificationPreferences,>(key: K, value: NotificationPreferences[K]) => {
    await updateNotificationPreferences({ [key]: value });
    setRuntimeStatus(await notificationService.getRuntimeStatus());
  };
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  };
  const timeControl = (key: 'morningTime' | 'afternoonTime' | 'eveningTime' | 'quietHoursStart' | 'quietHoursEnd') => (
    <input
      type="time"
      step="60"
      aria-label={key.replace(/([A-Z])/g, ' $1')}
      value={prefs[key]}
      onChange={(event) => {
        if (isValidClockTime(event.target.value)) void updateSetting(key, event.target.value);
      }}
      className="w-[112px] rounded-lg border border-[#392858] bg-[#1B1430] px-2 py-1.5 text-xs font-semibold text-white [color-scheme:dark] focus:border-[#FFD84D] focus:outline-none"
    />
  );

  useEffect(() => {
    let active = true;
    void notificationService.getRuntimeStatus().then((status) => {
      if (active) setRuntimeStatus(status);
    });
    return () => {
      active = false;
    };
  }, []);

  const enableOnDevice = async () => {
    setPermissionBusy(true);
    setPermissionError(null);
    try {
      const status = await notificationService.requestPermissionFromUser();
      setRuntimeStatus(status);
      if (status.permission === 'granted' && status.systemEnabled) {
        await updateSetting('enabled', true);
      } else if (status.permission === 'denied') {
        setPermissionError('Android has denied notification access. Change Sunny’s notification permission in Android app settings, then return here.');
      } else if (status.permissionRequested && status.permission !== 'granted') {
        setPermissionError('The Android permission prompt has already been shown. Enable Sunny notifications in Android app settings, then return here.');
      } else if (status.permission === 'unavailable') {
        setPermissionError('Sunny could not check Android notification access. Close and reopen the app, then try again.');
      } else if (status.permission === 'granted' && !status.systemEnabled) {
        setPermissionError('Notifications are turned off for Sunny in Android system settings.');
      }
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : 'Sunny could not request notification access.');
    } finally {
      setPermissionBusy(false);
    }
  };

  const handleMasterSwitch = async (enabled: boolean) => {
    if (!enabled) {
      await updateSetting('enabled', false);
      return;
    }

    const status = await notificationService.getRuntimeStatus();
    setRuntimeStatus(status);
    if (status.permission === 'unsupported') {
      await updateSetting('enabled', true);
      return;
    }
    await enableOnDevice();
  };

  const permissionSummary = !runtimeStatus
    ? 'Checking Android notification permission…'
    : !runtimeStatus.supported
      ? runtimeStatus.permission === 'unsupported'
        ? 'Local scheduled delivery is available in the Android app; this preference is still saved here.'
        : 'Android notification APIs are unavailable on this device.'
      : runtimeStatus.permission !== 'granted'
        ? `Preference ${preferences.notificationsEnabled ? 'on' : 'off'} · Android permission ${runtimeStatus.permission === 'prompt' || runtimeStatus.permission === 'prompt-with-rationale' ? runtimeStatus.permissionRequested ? 'not granted; prompt already shown' : 'not granted' : 'denied'}`
        : !runtimeStatus.systemEnabled
          ? `Preference ${preferences.notificationsEnabled ? 'on' : 'off'} · notifications are disabled by Android`
          : !runtimeStatus.userConsented
            ? `Preference ${preferences.notificationsEnabled ? 'on' : 'off'} · activate notifications on this device`
            : `Active on this device · ${runtimeStatus.scheduledCount} upcoming notification${runtimeStatus.scheduledCount === 1 ? '' : 's'}`;

  const canRequestPermission = Boolean(
    preferences.notificationsEnabled &&
    runtimeStatus?.supported &&
    ((runtimeStatus.permission === 'prompt' || runtimeStatus.permission === 'prompt-with-rationale') && !runtimeStatus.permissionRequested ||
      (runtimeStatus.permission === 'granted' && !runtimeStatus.userConsented && runtimeStatus.systemEnabled)),
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Top Bar */}
      <div className="flex items-center gap-3 py-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#21163A] border border-[#392858] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
          aria-label="Back to settings"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">Notification Preferences</h1>
      </div>

      {/* Delivery and permission status */}
      <div className="p-4 mb-5 rounded-2xl bg-[#17102C] border border-[#FFD84D]/30">
        <div className="flex items-center gap-2 mb-1">
          <Info size={18} className="text-[#FFD84D]" />
          <h2 className="text-sm font-bold text-[#FFD84D]">Android local notifications</h2>
        </div>
        <p className="text-xs text-[#C6B8E5] leading-relaxed">
          {permissionSummary} Scheduled reminders use local Android alarms and contain no chat or memory details. Android may defer inexact alarms, especially in battery-saving modes. The web app saves these preferences but does not deliver local notifications.
        </p>
        {canRequestPermission && (
          <AppButton
            title={runtimeStatus?.permission === 'granted' ? 'Enable on this device' : 'Allow Android notifications'}
            onPress={enableOnDevice}
            loading={permissionBusy}
            variant="secondary"
            className="mt-3 min-h-11"
          />
        )}
        {permissionError && <p role="alert" className="mt-3 text-xs text-[#FFD0D8]">{permissionError}</p>}
      </div>

      {/* Master Control */}
      <SettingsSection title="MASTER SWITCH">
        <SettingsRow
          title="Enable Notifications"
          subtitle="Your preference is separate from Android permission"
          icon={<Bell size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={preferences.notificationsEnabled}
          onSwitchChange={handleMasterSwitch}
        />
      </SettingsSection>

      {/* Scheduled Check-Ins */}
      <SettingsSection title="SCHEDULED CHECK-INS">
        <SettingsRow
          title="Morning time"
          subtitle={`Morning Sunshine (${formatTime(prefs.morningTime)})`}
          icon={<Sun size={16} className="text-[#FFD84D]" />}
          rightContent={timeControl('morningTime')}
          showChevron={false}
        />
        <SettingsRow
          title="Morning Sunshine"
          subtitle="Enable or pause the morning slot"
          icon={<Sun size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={prefs.morningEnabled}
          onSwitchChange={(val) => updateSetting('morningEnabled', val)}
        />
        <SettingsRow
          title="Afternoon time"
          subtitle={`Afternoon Check-in (${formatTime(prefs.afternoonTime)})`}
          icon={<Heart size={16} className="text-[#FF8D9A]" />}
          rightContent={timeControl('afternoonTime')}
          showChevron={false}
        />
        <SettingsRow
          title="Afternoon Check-in"
          subtitle="Enable or pause the afternoon slot"
          icon={<Heart size={16} className="text-[#FF8D9A]" />}
          isSwitch
          switchValue={prefs.afternoonEnabled}
          onSwitchChange={(val) => updateSetting('afternoonEnabled', val)}
        />
        <SettingsRow
          title="Evening time"
          subtitle={`Evening Wind-down (${formatTime(prefs.eveningTime)})`}
          icon={<Moon size={16} className="text-[#C6B8E5]" />}
          rightContent={timeControl('eveningTime')}
          showChevron={false}
        />
        <SettingsRow
          title="Evening Wind-down"
          subtitle="Enable or pause the evening slot"
          icon={<Moon size={16} className="text-[#C6B8E5]" />}
          isSwitch
          switchValue={prefs.eveningEnabled}
          onSwitchChange={(val) => updateSetting('eveningEnabled', val)}
        />
        <SettingsRow
          title="Memory Follow-ups"
          subtitle="Only revisit topics you approved"
          icon={<Bookmark size={16} className="text-[#A8D9A0]" />}
          isSwitch
          switchValue={prefs.memoryFollowUpsEnabled}
          onSwitchChange={(val) => updateSetting('memoryFollowUpsEnabled', val)}
        />
      </SettingsSection>

      {/* Boundaries & Frequency */}
      <SettingsSection title="BOUNDARIES & FREQUENCY">
        <SettingsRow
          title="Daily Cap"
          subtitle="Maximum notifications per day"
          icon={<Gauge size={16} className="text-[#FFD84D]" />}
          rightContent={(
            <select
              aria-label="Daily notification limit"
              value={prefs.dailyLimit}
              onChange={(event) => updateSetting('dailyLimit', Number(event.target.value))}
              className="rounded-lg border border-[#392858] bg-[#1B1430] px-2 py-1.5 text-xs font-semibold text-white focus:border-[#FFD84D] focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((limit) => <option key={limit} value={limit}>{limit} per day</option>)}
            </select>
          )}
          showChevron={false}
        />
        <SettingsRow
          title="Quiet Hours"
          subtitle={`Mute alerts from ${formatTime(prefs.quietHoursStart)} to ${formatTime(prefs.quietHoursEnd)}`}
          icon={<VolumeX size={16} className="text-[#C6B8E5]" />}
          isSwitch
          switchValue={prefs.quietHoursEnabled}
          onSwitchChange={(val) => updateSetting('quietHoursEnabled', val)}
        />
        <SettingsRow
          title="Quiet Hours Start"
          subtitle="Local time"
          icon={<Moon size={16} className="text-[#C6B8E5]" />}
          rightContent={timeControl('quietHoursStart')}
          showChevron={false}
        />
        <SettingsRow
          title="Quiet Hours End"
          subtitle="Local time"
          icon={<Moon size={16} className="text-[#C6B8E5]" />}
          rightContent={timeControl('quietHoursEnd')}
          showChevron={false}
        />
      </SettingsSection>

      {/* Preview Section */}
      <div className="mt-6">
        <h3 className="text-[11px] font-bold tracking-wider text-[#9B8AB9] uppercase px-1 mb-3">
          SAMPLE SUNNY NOTIFICATIONS
        </h3>
        <div className="space-y-2.5">
          {([
            { slot: 'morning', label: 'MORNING', name: 'Morning Sunshine', time: prefs.morningTime },
            { slot: 'afternoon', label: 'AFTERNOON', name: 'Afternoon Check-in', time: prefs.afternoonTime },
            { slot: 'evening', label: 'EVENING', name: 'Evening Wind-down', time: prefs.eveningTime },
          ] satisfies { slot: NotificationSlot; label: string; name: string; time: string }[]).map((item) => {
            const content = getNotificationContent(item.slot, localDateKey(new Date()));
            return (
              <AppCard key={item.slot} className="p-3.5 bg-[#21163A]">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge label={item.label} variant="yellow" />
                  <span className="text-xs text-[#9B8AB9]">{formatTime(item.time)}</span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-0.5">{item.name}</h4>
                <p className="text-xs italic text-[#C6B8E5] leading-relaxed">{content.body}</p>
              </AppCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
