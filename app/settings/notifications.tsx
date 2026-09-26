import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  notificationService,
  DEFAULT_NOTIFICATION_PREFERENCES,
  SAMPLE_NOTIFICATIONS,
} from '@/services/notificationService';
import { NotificationPreferences } from '@/types/notifications';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { Badge } from '@/components/ui/Badge';
import { AppCard } from '@/components/ui/AppCard';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationPreferencesScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadNotificationPrefs();
  }, []);

  const loadNotificationPrefs = async () => {
    const loaded = await notificationService.getPreferences();
    setPrefs(loaded);
    setLoading(false);
  };

  const updateSetting = async (key: keyof NotificationPreferences, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await notificationService.savePreferences(updated);
  };

  const deliveryStatus = notificationService.getDeliveryStatus();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Notice Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerHeader}>
            <Ionicons name="information-circle" size={18} color={Colors.sunshineYellow} />
            <Text style={styles.bannerTitle}>Demo Mode Notification Service</Text>
          </View>
          <Text style={styles.bannerText}>
            {deliveryStatus.statusLabel}. You can adjust and save your preferences locally. In production, these schedules connect to push notification services.
          </Text>
        </View>

        {/* Master Control */}
        <SettingsSection title="MASTER SWITCH">
          <SettingsRow
            title="Enable Notifications"
            subtitle="Receive gentle encouragement and check-ins"
            iconName="notifications"
            isSwitch
            switchValue={prefs.enabled}
            onSwitchChange={(val) => updateSetting('enabled', val)}
          />
        </SettingsSection>

        {/* Categories */}
        <SettingsSection title="SCHEDULED CHECK-INS">
          <SettingsRow
            title="Morning Sunshine"
            subtitle="Gentle start to your day (9:00 AM)"
            iconName="sunny"
            isSwitch
            switchValue={prefs.morningEnabled && prefs.enabled}
            onSwitchChange={(val) => updateSetting('morningEnabled', val)}
          />
          <SettingsRow
            title="Afternoon Check-in"
            subtitle="Midday breathing space (3:00 PM)"
            iconName="heart"
            isSwitch
            switchValue={prefs.afternoonEnabled && prefs.enabled}
            onSwitchChange={(val) => updateSetting('afternoonEnabled', val)}
          />
          <SettingsRow
            title="Evening Wind-down"
            subtitle="Peaceful end-of-day reflection (9:00 PM)"
            iconName="moon"
            isSwitch
            switchValue={prefs.eveningEnabled && prefs.enabled}
            onSwitchChange={(val) => updateSetting('eveningEnabled', val)}
          />
          <SettingsRow
            title="Memory Follow-ups"
            subtitle="Only revisit topics you approved"
            iconName="bookmark"
            isSwitch
            switchValue={prefs.memoryFollowUpsEnabled && prefs.enabled}
            onSwitchChange={(val) => updateSetting('memoryFollowUpsEnabled', val)}
          />
        </SettingsSection>

        {/* Quiet Hours & Frequency */}
        <SettingsSection title="BOUNDARIES & FREQUENCY">
          <SettingsRow
            title="Daily Cap"
            subtitle="Maximum notifications per day"
            iconName="speedometer"
            rightText={`${prefs.dailyLimit} per day`}
            showChevron={false}
          />
          <SettingsRow
            title="Quiet Hours"
            subtitle="Mute alerts from 10:00 PM to 8:00 AM"
            iconName="volume-mute"
            isSwitch
            switchValue={prefs.quietHoursEnabled}
            onSwitchChange={(val) => updateSetting('quietHoursEnabled', val)}
          />
        </SettingsSection>

        {/* Preview of Sunny Notifications */}
        <View style={styles.previewSection}>
          <Text style={styles.previewHeader}>SAMPLE SUNNY NOTIFICATIONS</Text>
          {SAMPLE_NOTIFICATIONS.map((item) => (
            <AppCard key={item.id} style={styles.sampleCard} padding={Spacing.md}>
              <View style={styles.sampleTop}>
                <Badge label={item.category.toUpperCase()} variant="yellow" />
                <Text style={styles.sampleTime}>{item.scheduledTime}</Text>
              </View>
              <Text style={styles.sampleTitle}>{item.title}</Text>
              <Text style={styles.sampleBody}>{item.body}</Text>
            </AppCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  banner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    ...Typography.bodyLarge,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.sunshineYellow,
    marginLeft: Spacing.xs,
  },
  bannerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  previewSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  previewHeader: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    letterSpacing: 1,
    fontWeight: '700',
  },
  sampleCard: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.cardBackground,
  },
  sampleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sampleTime: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  sampleTitle: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sampleBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
