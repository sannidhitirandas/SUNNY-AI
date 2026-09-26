import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

const CRISIS_RESOURCES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    contact: 'Call or Text 988',
    detail: 'Free, confidential, available 24/7 across the US & Canada.',
    action: () => Linking.openURL('tel:988'),
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    detail: 'Connect with a crisis counselor 24/7 via text message.',
    action: () => Linking.openURL('sms:741741'),
  },
  {
    name: 'The Trevor Project',
    contact: '1-866-488-7386',
    detail: '24/7 confidential crisis intervention for LGBTQ young people.',
    action: () => Linking.openURL('tel:18664887386'),
  },
  {
    name: 'International Helplines',
    contact: 'findahelpline.com',
    detail: 'Free, confidential crisis resources in over 130 countries.',
    action: () => Linking.openURL('https://findahelpline.com'),
  },
];

export default function SafetyScreen() {
  const [breathingStep, setBreathingStep] = useState<number>(0);

  const GROUNDING_STEPS = [
    { title: 'Take a slow breath', instruction: 'Inhale gently for 4 seconds, hold for 4, and exhale for 4.' },
    { title: '5 things you can see', instruction: 'Look around and notice five distinct objects in your room.' },
    { title: '4 things you can feel', instruction: 'Notice your feet on the floor, your clothes against your skin, or the temperature in the room.' },
    { title: '3 things you can hear', instruction: 'Listen for sounds in the background: wind, humming, distant voices.' },
    { title: '2 things you can smell', instruction: 'Notice any scent around you or breathe in fresh air.' },
    { title: '1 thing you like about yourself', instruction: 'Acknowledge one kind quality or strength you have.' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Important Boundary Card */}
        <AppCard style={styles.disclaimerCard} padding={Spacing.lg}>
          <View style={styles.disclaimerHeader}>
            <Ionicons name="shield" size={20} color={Colors.sunshineYellow} />
            <Text style={styles.disclaimerTitle}>Sunny is an AI Companion</Text>
          </View>
          <Text style={styles.disclaimerBody}>
            Sunny is designed for everyday conversation, personal reflection, and light encouragement.
            {'\n\n'}
            Sunny is <Text style={styles.bold}>not</Text> a human, therapist, physician, or emergency service. It cannot provide clinical assessments, crisis intervention, or medical advice.
          </Text>
        </AppCard>

        {/* 24/7 Crisis Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IMMEDIATE CRISIS SUPPORT</Text>
          <Text style={styles.sectionSubtitle}>
            If you or someone you know is in immediate danger or experiencing a mental health emergency, please contact these free, confidential resources:
          </Text>

          {CRISIS_RESOURCES.map((r, i) => (
            <AppCard key={i} style={styles.resourceCard} padding={Spacing.md}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceIconBox}>
                  <Ionicons name="call" size={18} color="#FF8D9A" />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>{r.name}</Text>
                  <Text style={styles.resourceContact}>{r.contact}</Text>
                </View>
              </View>
              <Text style={styles.resourceDetail}>{r.detail}</Text>
              <TouchableOpacity
                onPress={r.action}
                style={styles.connectButton}
                accessibilityLabel={`Connect with ${r.name}`}
              >
                <Text style={styles.connectText}>Connect Now</Text>
                <Ionicons name="open-outline" size={14} color={Colors.sunshineYellow} />
              </TouchableOpacity>
            </AppCard>
          ))}
        </View>

        {/* Interactive Mindful Grounding Tool */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GENTLE GROUNDING EXERCISE</Text>
          <Text style={styles.sectionSubtitle}>
            When things feel overwhelming, try the 5-4-3-2-1 technique to reconnect with your senses:
          </Text>

          <AppCard elevated style={styles.groundingCard} padding={Spacing.lg}>
            <Text style={styles.groundingStepNumber}>
              Step {breathingStep + 1} of {GROUNDING_STEPS.length}
            </Text>
            <Text style={styles.groundingTitle}>
              {GROUNDING_STEPS[breathingStep].title}
            </Text>
            <Text style={styles.groundingInstruction}>
              {GROUNDING_STEPS[breathingStep].instruction}
            </Text>

            <View style={styles.groundingControls}>
              <AppButton
                title={breathingStep === GROUNDING_STEPS.length - 1 ? 'Start Over' : 'Next Step'}
                onPress={() =>
                  setBreathingStep((prev) => (prev + 1) % GROUNDING_STEPS.length)
                }
                variant="primary"
                size="small"
              />
            </View>
          </AppCard>
        </View>
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
  disclaimerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderColor: 'rgba(255, 216, 77, 0.3)',
    backgroundColor: Colors.secondaryBackground,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  disclaimerTitle: {
    ...Typography.h3,
    color: Colors.sunshineYellow,
    marginLeft: Spacing.xs,
  },
  disclaimerBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    letterSpacing: 1,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
    lineHeight: 18,
  },
  resourceCard: {
    marginBottom: Spacing.sm,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resourceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.errorBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resourceContact: {
    ...Typography.bodySmall,
    color: Colors.sunshineYellow,
    fontWeight: '700',
  },
  resourceDetail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.yellowSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.3)',
  },
  connectText: {
    ...Typography.caption,
    color: Colors.sunshineYellow,
    fontWeight: '700',
    marginRight: 4,
  },
  groundingCard: {
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  groundingStepNumber: {
    ...Typography.caption,
    color: Colors.sunshineYellow,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  groundingTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  groundingInstruction: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 280,
    lineHeight: 22,
  },
  groundingControls: {
    marginTop: Spacing.xs,
  },
});
