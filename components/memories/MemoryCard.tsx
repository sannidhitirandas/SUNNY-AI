import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Memory } from '@/types/memory';
import { AppCard } from '../ui/AppCard';
import { Badge } from '../ui/Badge';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onEdit,
  onDelete,
}) => {
  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'personal':
        return 'purple';
      case 'relationships':
        return 'yellow';
      case 'events':
        return 'green';
      default:
        return 'purple';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Memory?',
      `Are you sure you want to forget "${memory.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(memory.id) },
      ]
    );
  };

  return (
    <AppCard style={styles.card} padding={Spacing.lg}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Badge
            label={memory.category.toUpperCase()}
            variant={getCategoryBadgeVariant(memory.category) as any}
          />
          {memory.isDemoData && (
            <Badge label="Sample" variant="muted" style={styles.sampleBadge} />
          )}
        </View>
        <Text style={styles.dateText}>{formatDate(memory.createdAt)}</Text>
      </View>

      <Text style={styles.title}>{memory.title}</Text>
      <Text style={styles.content}>{memory.content}</Text>

      <View style={styles.bottomRow}>
        <View style={styles.consentIndicator}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
          <Text style={styles.consentText}>Consent confirmed</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => onEdit(memory)}
            style={styles.actionButton}
            accessibilityLabel={`Edit memory ${memory.title}`}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeletePress}
            style={[styles.actionButton, styles.deleteButton]}
            accessibilityLabel={`Delete memory ${memory.title}`}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleBadge: {
    marginLeft: 6,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  title: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  content: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: Spacing.sm,
  },
  consentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.elevatedCard,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: Colors.errorBackground,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  deleteText: {
    color: Colors.error,
  },
});
