import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingMemory() {
  const router = useRouter();
  const { preferences, toggleMemory } = usePreferences();
  const [memoryConsent, setMemoryConsent] = useState<boolean>(preferences.memoryEnabled);

  const handleContinue = async () => {
    await toggleMemory(memoryConsent);
    router.push('/onboarding/notifications');
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step 3 of 4</Text>
      </View>

      <Text style={styles.title}>Sunny can remember the little things.</Text>
      <Text style={styles.subtitle}>
        With your permission, Sunny can remember details you choose to share—like your interests, important events, and things you want to revisit.
      </Text>

      <View style={styles.optionsContainer}>
        {/* Enable Memory Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMemoryConsent(true)}
          style={[styles.card, memoryConsent && styles.cardSelected]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, memoryConsent && styles.iconBoxSelected]}>
              <Ionicons
                name="bookmark"
                size={20}
                color={memoryConsent ? Colors.sunshineYellow : Colors.textSecondary}
              />
            </View>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, memoryConsent && styles.cardTitleSelected]}>
                Enable memory
              </Text>
            </View>
            <View style={[styles.radioCircle, memoryConsent && styles.radioCircleSelected]}>
              {memoryConsent && <View style={styles.radioInner} />}
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Sunny remembers meaningful personal context so you don't have to re-explain yourself every time.
          </Text>
        </TouchableOpacity>

        {/* Keep Memory Off Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMemoryConsent(false)}
          style={[styles.card, !memoryConsent && styles.cardSelected]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, !memoryConsent && styles.iconBoxSelected]}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={!memoryConsent ? Colors.sunshineYellow : Colors.textSecondary}
              />
            </View>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, !memoryConsent && styles.cardTitleSelected]}>
                Keep memory off for now
              </Text>
            </View>
            <View style={[styles.radioCircle, !memoryConsent && styles.radioCircleSelected]}>
              {!memoryConsent && <View style={styles.radioInner} />}
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Conversations will remain session-by-session without long-term notes saved.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color={Colors.sunshineYellow} style={styles.noteIcon} />
        <Text style={styles.noteText}>
          You are always in control. You can view, edit, or delete any saved memory at any time in the Memories tab.
        </Text>
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
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  cardSelected: {
    borderColor: Colors.sunshineYellow,
    backgroundColor: Colors.elevatedCard,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.elevatedCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconBoxSelected: {
    backgroundColor: Colors.yellowSubtle,
  },
  titleRow: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  cardTitleSelected: {
    color: Colors.sunshineYellow,
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
  cardDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
  },
  noteIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    marginTop: Spacing.sm,
  },
});
