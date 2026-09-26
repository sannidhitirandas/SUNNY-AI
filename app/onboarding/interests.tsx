import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

const AVAILABLE_INTERESTS = [
  'Someone to listen',
  'A little encouragement',
  'Everyday conversations',
  'Help feeling more confident socially',
  'A fun distraction',
  'A space to reflect on my day',
  'Remembering the little things about me',
];

export default function OnboardingInterests() {
  const router = useRouter();
  const { preferences, updateInterests } = usePreferences();
  const [selected, setSelected] = useState<string[]>(preferences.interests || []);

  const toggleInterest = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const handleContinue = async () => {
    await updateInterests(selected);
    router.push('/onboarding/personality');
  };

  const handleSkip = () => {
    router.push('/onboarding/personality');
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step 1 of 4</Text>
      </View>

      <Text style={styles.title}>What brings you here?</Text>
      <Text style={styles.subtitle}>
        Select anything you'd like Sunny to help with. You can change this anytime.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {AVAILABLE_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              activeOpacity={0.8}
              onPress={() => toggleInterest(interest)}
              style={[
                styles.itemCard,
                isSelected && styles.itemCardSelected,
              ]}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={Colors.textDark} />
                )}
              </View>
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {interest}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          style={styles.continueBtn}
        />
        <AppButton
          title="Skip for now"
          onPress={handleSkip}
          variant="ghost"
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
    lineHeight: 20,
  },
  list: {
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  itemCardSelected: {
    borderColor: Colors.sunshineYellow,
    backgroundColor: Colors.elevatedCard,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxSelected: {
    backgroundColor: Colors.sunshineYellow,
    borderColor: Colors.sunshineYellow,
  },
  itemText: {
    ...Typography.bodyLarge,
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
  itemTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    marginTop: Spacing.sm,
  },
  continueBtn: {
    marginBottom: Spacing.xs,
  },
});
