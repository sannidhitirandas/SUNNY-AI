import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'yellow' | 'purple' | 'green' | 'muted';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'purple',
  icon,
  style,
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'yellow':
        return styles.yellowBadge;
      case 'green':
        return styles.greenBadge;
      case 'muted':
        return styles.mutedBadge;
      case 'purple':
      default:
        return styles.purpleBadge;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'yellow':
        return styles.yellowText;
      case 'green':
        return styles.greenText;
      case 'muted':
        return styles.mutedText;
      case 'purple':
      default:
        return styles.purpleText;
    }
  };

  return (
    <View style={[styles.badge, getContainerStyle(), style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, getTextStyle()]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  purpleBadge: {
    backgroundColor: Colors.elevatedCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  purpleText: {
    color: Colors.textSecondary,
  },
  yellowBadge: {
    backgroundColor: Colors.yellowSubtle,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 77, 0.4)',
  },
  yellowText: {
    color: Colors.sunshineYellow,
  },
  greenBadge: {
    backgroundColor: Colors.successBackground,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  greenText: {
    color: Colors.success,
  },
  mutedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mutedText: {
    color: Colors.textMuted,
  },
});
