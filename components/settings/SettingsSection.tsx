import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <AppCard style={styles.card} padding={0}>
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < childrenArray.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  title: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    letterSpacing: 1,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 48,
  },
});
