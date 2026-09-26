import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingNotifications() {
  const router = useRouter();
  const { preferences, toggleNotifications } = usePreferences();
  const [notifyConsent, setNotifyConsent] = useState<boolean>(preferences.notificationsEnabled);

  const handleContinue = async () => {
    await toggleNotifications(notifyConsent);
    router.push('/onboarding/complete');
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step 4 of 4</Text>
      </View>

      <Text style={styles.title}>A little sunshine throughout your day?</Text>
      <Text style={styles.subtitle}>
        Sunny can send occasional gentle notes to brighten your morning, afternoon, or evening. Never spammy, never guilt-tripping.
      </Text>

      <View style={styles.previewBox}>
        <View style={styles.sampleItem}>
          <Ionicons name="sunny" size={18} color={Colors.sunshineYellow} style={styles.sampleIcon} />
          <View style={styles.sampleText}>
            <Text style={styles.sampleTitle}>Morning Sunshine</Text>
            <Text style={styles.sampleBody}>"Good morning, sunshine. ☀️ I hope today brings you one little thing to smile about."</Text>
          </View>
        </View>

        <View style={styles.sampleItem}>
          <Ionicons name="heart" size={18} color="#FF8D9A" style={styles.sampleIcon} />
          <View style={styles.sampleText}>
            <Text style={styles.sampleTitle}>Gentle Check-in</Text>
            <Text style={styles.sampleBody}>"Hey, sunshine. 💛 How's your day going? No pressure to reply."</Text>
          </View>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {/* Enable Notifications */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setNotifyConsent(true)}
          style={[styles.card, notifyConsent && styles.cardSelected]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, notifyConsent && styles.iconBoxSelected]}>
              <Ionicons
                name="notifications"
                size={20}
                color={notifyConsent ? Colors.sunshineYellow : Colors.textSecondary}
              />
            </View>
            <Text style={[styles.cardTitle, notifyConsent && styles.cardTitleSelected]}>
              Enable gentle notifications
            </Text>
            <View style={[styles.radioCircle, notifyConsent && styles.radioCircleSelected]}>
              {notifyConsent && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

        {/* Not Now */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setNotifyConsent(false)}
          style={[styles.card, !notifyConsent && styles.cardSelected]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, !notifyConsent && styles.iconBoxSelected]}>
              <Ionicons
                name="notifications-off"
                size={20}
                color={!notifyConsent ? Colors.sunshineYellow : Colors.textSecondary}
              />
            </View>
            <Text style={[styles.cardTitle, !notifyConsent && styles.cardTitleSelected]}>
              Not now
            </Text>
            <View style={[styles.radioCircle, !notifyConsent && styles.radioCircleSelected]}>
              {!notifyConsent && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <AppButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },
  stepIndicator: {
    marginBottom: Spacing.sm,
  },
  stepText: {
    ...Typography.caption,
    color: Colors.sunshineYellow,
    fontWeight: '700',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  previewBox: {
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sampleIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  sampleText: {
    flex: 1,
  },
  sampleTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sampleBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  cardSelected: {
    borderColor: Colors.sunshineYellow,
    backgroundColor: Colors.elevatedCard,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.elevatedCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconBoxSelected: {
    backgroundColor: Colors.yellowSubtle,
  },
  cardTitle: {
    ...Typography.bodyLarge,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardTitleSelected: {
    color: Colors.sunshineYellow,
    fontWeight: '600',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.sunshineYellow,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.sunshineYellow,
  },
  footer: {
    marginTop: Spacing.sm,
  },
});
