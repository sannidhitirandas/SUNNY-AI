import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface AppCardProps {
  children: React.ReactNode;
  elevated?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  elevated = false,
  highlighted = false,
  onPress,
  style,
  padding = Spacing.lg,
}) => {
  const cardStyle: ViewStyle[] = [
    styles.card,
    elevated ? styles.elevated : styles.default,
    highlighted ? styles.highlighted : undefined,
    { padding },
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={cardStyle}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.elevatedCard,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  highlighted: {
    borderColor: Colors.sunshineYellow,
    backgroundColor: Colors.elevatedCard,
  },
});
