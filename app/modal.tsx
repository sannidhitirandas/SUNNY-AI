import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppButton } from '@/components/ui/AppButton';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SunnyLogo size="medium" />
      <Text style={styles.title}>A Moment for You</Text>
      <Text style={styles.body}>
        "Take a slow breath. You don't have to carry everything all at once. What's one gentle thought you can offer yourself right now?"
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Remember: Sunny is right here whenever you want to chat, laugh, or reflect.
        </Text>
      </View>
      <AppButton
        title="Return to Sunny"
        onPress={() => router.back()}
        variant="primary"
        style={styles.closeBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  body: {
    ...Typography.bodyLarge,
    color: Colors.sunshineYellow,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cardText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    minWidth: 180,
  },
});
