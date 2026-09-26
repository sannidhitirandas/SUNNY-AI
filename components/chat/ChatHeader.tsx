import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '../brand/SunnyLogo';
import { Badge } from '../ui/Badge';
import { Ionicons } from '@expo/vector-icons';

interface ChatHeaderProps {
  onBack?: () => void;
  onOptionsPress: () => void;
  isDemoMode?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBack,
  onOptionsPress,
  isDemoMode = true,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.avatarWrapper}>
          <SunnyLogo size="small" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>Sunny</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>AI Companion</Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        {isDemoMode && (
          <Badge label="Demo mode" variant="yellow" style={styles.demoBadge} />
        )}
        <TouchableOpacity
          onPress={onOptionsPress}
          style={styles.iconButton}
          accessibilityLabel="Chat options"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: Spacing.sm,
  },
  info: {
    justifyContent: 'center',
  },
  name: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sunshineYellow,
    marginRight: 5,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoBadge: {
    marginRight: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
  },
});
