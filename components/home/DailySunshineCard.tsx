import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const DAILY_REMINDERS = [
  "You don't have to figure everything out today. One small step is enough.",
  'Taking a break is not giving up. It is giving yourself room to breathe.',
  'Be proud of yourself for showing up today, even in quiet, gentle ways.',
  "Whatever pace you are moving at right now is completely okay.",
  "You are allowed to take things one breath and one moment at a time.",
];

export const DailySunshineCard: React.FC = () => {
  const [index, setIndex] = useState<number>(0);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % DAILY_REMINDERS.length);
  };

  return (
    <AppCard style={styles.card} padding={Spacing.lg}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Little reminder 💛</Text>
        </View>
        <TouchableOpacity
          onPress={handleNext}
          style={styles.refreshButton}
          accessibilityLabel="Read another reminder"
        >
          <Ionicons name="sparkles-outline" size={16} color={Colors.sunshineYellow} />
          <Text style={styles.refreshText}>Another</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.content}>"{DAILY_REMINDERS[index]}"</Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.secondaryBackground,
    borderColor: 'rgba(255, 216, 77, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.sunshineYellow,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.yellowSubtle,
  },
  refreshText: {
    fontSize: 11,
    color: Colors.sunshineYellow,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
