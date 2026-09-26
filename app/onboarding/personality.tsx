import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PersonalityTone } from '@/types/user';
import { usePreferences } from '@/context/PreferencesContext';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

interface ToneOption {
  tone: PersonalityTone;
  title: string;
  badge?: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    tone: 'adaptive',
    title: 'Adaptive',
    badge: 'Recommended',
    description: 'A balanced companion that adjusts naturally to your conversation context and tone.',
    iconName: 'sparkles',
  },
  {
    tone: 'playful',
    title: 'Playful',
    description: 'Cheerful, humorous, lighthearted, and ready to share laughs and silly ideas.',
    iconName: 'happy',
  },
  {
    tone: 'gentle',
    title: 'Gentle',
    description: 'Soft, patient, empathetic, and reassuring when you need a quiet listening ear.',
    iconName: 'heart',
  },
  {
    tone: 'calm',
    title: 'Calm',
    description: 'Grounded, thoughtful, and peaceful to help you unwind and reflect without rush.',
    iconName: 'leaf',
  },
];

export default function OnboardingPersonality() {
  const router = useRouter();
  const { preferences, updateTone } = usePreferences();
  const [selectedTone, setSelectedTone] = useState<PersonalityTone>(
    preferences.preferredTone || 'adaptive'
  );

  const handleContinue = async () => {
    await updateTone(selectedTone);
    router.push('/onboarding/memory');
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step 2 of 4</Text>
      </View>

      <Text style={styles.title}>Choose Sunny's vibe</Text>
      <Text style={styles.subtitle}>
        How would you like Sunny to feel? You can change this anytime in settings.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {TONE_OPTIONS.map((item) => {
          const isSelected = selectedTone === item.tone;
          return (
            <TouchableOpacity
              key={item.tone}
              activeOpacity={0.8}
              onPress={() => setSelectedTone(item.tone)}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Ionicons
                    name={item.iconName}
                    size={20}
                    color={isSelected ? Colors.sunshineYellow : Colors.textSecondary}
                  />
                </View>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {item.title}
                  </Text>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
              <Text style={styles.description}>{item.description}</Text>
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
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  cardTitleSelected: {
    color: Colors.sunshineYellow,
  },
  badge: {
    marginLeft: 8,
    backgroundColor: Colors.yellowSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
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
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  footer: {
    marginTop: Spacing.sm,
  },
});
