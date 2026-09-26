import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { SunnyLogo } from '../brand/SunnyLogo';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface GreetingCardProps {
  displayName?: string;
  onTalkPress: () => void;
}

export const GreetingCard: React.FC<GreetingCardProps> = ({
  displayName = 'sunshine',
  onTalkPress,
}) => {
  return (
    <AppCard elevated style={styles.card} padding={Spacing.xl}>
      <View style={styles.sunHeader}>
        <SunnyLogo size="medium" />
        <View style={styles.ambientPill}>
          <Text style={styles.pillText}>Safe & Private Space</Text>
        </View>
      </View>

      <Text style={styles.greetingTitle}>
        Hey, {displayName || 'sunshine'}. 💛
      </Text>
      <Text style={styles.subQuestion}>How are you feeling today?</Text>
      <Text style={styles.description}>
        No pressure to be okay. We can talk, laugh, or just take things one moment at a time.
      </Text>

      <AppButton
        title="Talk to Sunny"
        onPress={onTalkPress}
        variant="primary"
        size="large"
        icon={<Ionicons name="chatbubble-ellipses" size={18} color={Colors.textDark} />}
        style={styles.button}
      />
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderColor: 'rgba(255, 216, 77, 0.25)',
  },
  sunHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  ambientPill: {
    backgroundColor: Colors.yellowSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.3)',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.sunshineYellow,
  },
  greetingTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subQuestion: {
    ...Typography.h3,
    color: Colors.sunshineYellow,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  button: {
    marginTop: Spacing.xs,
  },
});
