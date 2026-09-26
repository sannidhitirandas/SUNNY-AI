import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppCard } from '@/components/ui/AppCard';
import { Badge } from '@/components/ui/Badge';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Brand Hero */}
        <View style={styles.hero}>
          <SunnyLogo size="large" />
          <Text style={styles.appName}>Sunny</Text>
          <Text style={styles.tagline}>A Personal AI Companion</Text>
          <Badge label="Version 1.0.0 (Demo Mode)" variant="yellow" style={styles.versionBadge} />
        </View>

        {/* Vision Card */}
        <AppCard style={styles.card} padding={Spacing.lg}>
          <Text style={styles.cardTitle}>The Vision</Text>
          <Text style={styles.cardBody}>
            Sunny was born out of a desire for a softer, warmer digital space. A companion that remembers what matters to you with your permission, so that you never have to feel like you're starting completely over.
          </Text>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>
              "You don't have to start over every time you come back."
            </Text>
          </View>
        </AppCard>

        {/* Tech Stack Card */}
        <AppCard style={styles.card} padding={Spacing.lg}>
          <Text style={styles.cardTitle}>Technology Architecture</Text>
          <Text style={styles.cardBody}>
            Built with modern mobile-first engineering standards:
          </Text>
          <View style={styles.techList}>
            <Text style={styles.techItem}>• <Text style={styles.bold}>Framework:</Text> React Native 0.86 + Expo 57</Text>
            <Text style={styles.techItem}>• <Text style={styles.bold}>Navigation:</Text> Expo Router (File-based tabs & stacks)</Text>
            <Text style={styles.techItem}>• <Text style={styles.bold}>Language:</Text> TypeScript (Strict typing)</Text>
            <Text style={styles.techItem}>• <Text style={styles.bold}>Storage:</Text> Typed AsyncStorage Local Persistence</Text>
            <Text style={styles.techItem}>• <Text style={styles.bold}>Design System:</Text> Dark Purple & Sunshine Yellow (#100B22 / #FFD84D)</Text>
            <Text style={styles.techItem}>• <Text style={styles.bold}>Service Layer:</Text> Decoupled typed service contracts ready for PostgreSQL & Node/Express/FastAPI backend</Text>
          </View>
        </AppCard>

        {/* Core Principles */}
        <AppCard style={styles.card} padding={Spacing.lg}>
          <Text style={styles.cardTitle}>Core Principles</Text>
          <View style={styles.principleItem}>
            <Text style={styles.principleHeader}>1. Emotional Safety</Text>
            <Text style={styles.principleBody}>
              Nonjudgmental, empathetic, and clear about being an AI without masquerading as human or therapist.
            </Text>
          </View>
          <View style={styles.principleItem}>
            <Text style={styles.principleHeader}>2. Transparent Memory</Text>
            <Text style={styles.principleBody}>
              Nothing is saved secretly. Every memory is visible, editable, and deletable by you.
            </Text>
          </View>
          <View style={styles.principleItem}>
            <Text style={styles.principleHeader}>3. Gentle Encouragement</Text>
            <Text style={styles.principleBody}>
              No streaks, no guilt trips, no pressure. Sunny is here when you need it, and quiet when you don't.
            </Text>
          </View>
        </AppCard>
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
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  appName: {
    ...Typography.h1,
    fontSize: 26,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  versionBadge: {
    marginTop: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  quoteBox: {
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.25)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  quoteText: {
    ...Typography.body,
    color: Colors.sunshineYellow,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  techList: {
    marginTop: Spacing.sm,
    gap: 6,
  },
  techItem: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  principleItem: {
    marginTop: Spacing.sm,
  },
  principleHeader: {
    ...Typography.bodyLarge,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.sunshineYellow,
  },
  principleBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
