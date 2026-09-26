import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.textPrimary }} />
      <View style={styles.container}>
        <SunnyLogo size="medium" />
        <Text style={styles.title}>This corner seems a bit quiet.</Text>
        <Text style={styles.description}>We couldn't find the screen you were looking for.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Sunny ☀️</Text>
        </Link>
      </View>
    </>
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
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  link: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.yellowSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.4)',
  },
  linkText: {
    ...Typography.buttonText,
    color: Colors.sunshineYellow,
  },
});
