import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppButton } from '@/components/ui/AppButton';

export default function OnboardingComplete() {
  const router = useRouter();
  const { completeOnboarding } = usePreferences();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 30,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handleMeetSunny = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <SunnyLogo size="large" />

        <Text style={styles.title}>
          Your little corner of sunshine is ready. 💛
        </Text>

        <Text style={styles.body}>
          Sunny is here whenever you need a moment to reflect, laugh, or just talk through your day.
        </Text>

        <View style={styles.tipCard}>
          <Text style={styles.tipHeader}>Friendly companion note</Text>
          <Text style={styles.tipText}>
            Sunny is an AI companion designed for everyday thoughts and comfort. Remember to take good care of yourself and lean on real friends and professional support whenever needed.
          </Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <AppButton
          title="Meet Sunny"
          onPress={handleMeetSunny}
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
    paddingBottom: Spacing.xxl,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    lineHeight: 34,
  },
  body: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  tipCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
  },
  tipHeader: {
    ...Typography.caption,
    color: Colors.sunshineYellow,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  footer: {
    width: '100%',
  },
});
