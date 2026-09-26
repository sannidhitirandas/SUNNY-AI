import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';

export default function SplashScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading } = usePreferences();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Gentle fade-in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isLoading) {
      const timer = setTimeout(() => {
        if (hasCompletedOnboarding) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [isLoading, hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <SunnyLogo size="huge" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Sunny</Text>
          <Text style={styles.tagline}>Your little corner of sunshine.</Text>
        </View>

        <View style={styles.loadingIndicator}>
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    fontSize: 34,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loadingIndicator: {
    marginTop: Spacing.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sunshineYellow,
    opacity: 0.8,
  },
});
