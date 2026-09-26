import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppButton } from '@/components/ui/AppButton';

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <SunnyLogo size="large" />
        </View>

        <Text style={styles.greeting}>Hey, sunshine. ☀️</Text>
        <Text style={styles.description}>
          Meet Sunny, your little corner of sunshine. A friendly, comforting space to talk, laugh, reflect, and feel a little less alone.
        </Text>

        <View style={styles.promiseBox}>
          <Text style={styles.promiseText}>
            "You don't have to start over every time you come back."
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton
          title="Let's get started"
          onPress={() => router.push('/onboarding/interests')}
          variant="primary"
          size="large"
          fullWidth
          style={styles.primaryButton}
        />
        <AppButton
          title="I already have an account"
          onPress={() => router.push('/auth/login')}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xxl,
  },
  content: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  logoWrapper: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.h1,
    fontSize: 30,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  promiseBox: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.25)',
    borderRadius: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  promiseText: {
    ...Typography.body,
    color: Colors.sunshineYellow,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    width: '100%',
  },
  primaryButton: {
    marginBottom: Spacing.xs,
  },
});
