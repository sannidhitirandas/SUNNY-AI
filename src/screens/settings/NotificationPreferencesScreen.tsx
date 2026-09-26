import React, { useState, useEffect } from 'react';
import {
  notificationService,
  DEFAULT_NOTIFICATION_PREFERENCES,
  SAMPLE_NOTIFICATIONS,
} from '@/services/notificationService';
import { NotificationPreferences } from '@/types/notifications';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { Badge } from '@/components/ui/Badge';
import { AppCard } from '@/components/ui/AppCard';
import { ArrowLeft, Info, Bell, Sun, Heart, Moon, Bookmark, Gauge, VolumeX } from 'lucide-react';

interface NotificationPreferencesScreenProps {
  onBack: () => void;
}

export const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({ onBack }) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);

  useEffect(() => {
    loadNotificationPrefs();
  }, []);

  const loadNotificationPrefs = async () => {
    const loaded = await notificationService.getPreferences();
    setPrefs(loaded);
  };

  const updateSetting = async (key: keyof NotificationPreferences, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await notificationService.savePreferences(updated);
  };

  const deliveryStatus = notificationService.getDeliveryStatus();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Top Bar */}
      <div className="flex items-center gap-3 py-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg bg-[#21163A] border border-[#392858] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
          aria-label="Back to settings"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">Notification Preferences</h1>
      </div>

      {/* Notice Banner */}
      <div className="p-4 mb-5 rounded-2xl bg-[#17102C] border border-[#FFD84D]/30">
        <div className="flex items-center gap-2 mb-1">
          <Info size={18} className="text-[#FFD84D]" />
          <h2 className="text-sm font-bold text-[#FFD84D]">Demo Mode Notification Service</h2>
        </div>
        <p className="text-xs text-[#C6B8E5] leading-relaxed">
          {deliveryStatus.statusLabel}. You can adjust and save your preferences locally. In production, these schedules connect to push notification services.
        </p>
      </div>

      {/* Master Control */}
      <SettingsSection title="MASTER SWITCH">
        <SettingsRow
          title="Enable Notifications"
          subtitle="Receive gentle encouragement and check-ins"
          icon={<Bell size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={prefs.enabled}
          onSwitchChange={(val) => updateSetting('enabled', val)}
        />
      </SettingsSection>

      {/* Scheduled Check-Ins */}
      <SettingsSection title="SCHEDULED CHECK-INS">
        <SettingsRow
          title="Morning Sunshine"
          subtitle="Gentle start to your day (9:00 AM)"
          icon={<Sun size={16} className="text-[#FFD84D]" />}
          isSwitch
          switchValue={prefs.morningEnabled && prefs.enabled}
          onSwitchChange={(val) => updateSetting('morningEnabled', val)}
        />
        <SettingsRow
          title="Afternoon Check-in"
          subtitle="Midday breathing space (3:00 PM)"
          icon={<Heart size={16} className="text-[#FF8D9A]" />}
          isSwitch
          switchValue={prefs.afternoonEnabled && prefs.enabled}
          onSwitchChange={(val) => updateSetting('afternoonEnabled', val)}
        />
        <SettingsRow
          title="Evening Wind-down"
          subtitle="Peaceful end-of-day reflection (9:00 PM)"
          icon={<Moon size={16} className="text-[#C6B8E5]" />}
          isSwitch
          switchValue={prefs.eveningEnabled && prefs.enabled}
          onSwitchChange={(val) => updateSetting('eveningEnabled', val)}
        />
        <SettingsRow
          title="Memory Follow-ups"
          subtitle="Only revisit topics you approved"
          icon={<Bookmark size={16} className="text-[#A8D9A0]" />}
          isSwitch
          switchValue={prefs.memoryFollowUpsEnabled && prefs.enabled}
          onSwitchChange={(val) => updateSetting('memoryFollowUpsEnabled', val)}
        />
      </SettingsSection>

      {/* Boundaries & Frequency */}
      <SettingsSection title="BOUNDARIES & FREQUENCY">
        <SettingsRow
          title="Daily Cap"
          subtitle="Maximum notifications per day"
          icon={<Gauge size={16} className="text-[#FFD84D]" />}
          rightText={`${prefs.dailyLimit} per day`}
          showChevron={false}
        />
        <SettingsRow
          title="Quiet Hours"
          subtitle="Mute alerts from 10:00 PM to 8:00 AM"
          icon={<VolumeX size={16} className="text-[#C6B8E5]" />}
          isSwitch
          switchValue={prefs.quietHoursEnabled}
          onSwitchChange={(val) => updateSetting('quietHoursEnabled', val)}
        />
      </SettingsSection>

      {/* Preview Section */}
      <div className="mt-6">
        <h3 className="text-[11px] font-bold tracking-wider text-[#9B8AB9] uppercase px-1 mb-3">
          SAMPLE SUNNY NOTIFICATIONS
        </h3>
        <div className="space-y-2.5">
          {SAMPLE_NOTIFICATIONS.map((item) => (
            <AppCard key={item.id} className="p-3.5 bg-[#21163A]">
              <div className="flex items-center justify-between mb-1.5">
                <Badge label={item.category.toUpperCase()} variant="yellow" />
                <span className="text-xs text-[#9B8AB9]">{item.scheduledTime}</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-0.5">{item.title}</h4>
              <p className="text-xs italic text-[#C6B8E5] leading-relaxed">{item.body}</p>
            </AppCard>
          ))}
        </div>
      </div>
    </div>
  );
};
