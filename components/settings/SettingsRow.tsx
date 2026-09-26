import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  rightText?: string;
  showChevron?: boolean;
  destructive?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  subtitle,
  iconName,
  iconColor = Colors.sunshineYellow,
  onPress,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  rightText,
  showChevron = true,
  destructive = false,
}) => {
  const content = (
    <View style={styles.container}>
      {iconName && (
        <View style={[styles.iconBox, destructive && styles.destructiveIconBox]}>
          <Ionicons
            name={iconName}
            size={18}
            color={destructive ? Colors.error : iconColor}
          />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={[styles.title, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: Colors.inputBackground, true: Colors.sunshineYellow }}
          thumbColor={switchValue ? Colors.textDark : '#f4f3f4'}
        />
      ) : rightText ? (
        <View style={styles.rightRow}>
          <Text style={styles.rightText}>{rightText}</Text>
          {showChevron && (
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          )}
        </View>
      ) : showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      ) : null}
    </View>
  );

  if (isSwitch || !onPress) {
    return content;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.elevatedCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  destructiveIconBox: {
    backgroundColor: Colors.errorBackground,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.bodyLarge,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  destructiveText: {
    color: Colors.error,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    ...Typography.bodySmall,
    color: Colors.sunshineYellow,
    marginRight: 6,
    fontWeight: '500',
  },
});
