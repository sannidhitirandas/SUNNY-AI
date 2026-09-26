import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/types/chat';
import { AppCard } from '../ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface RecentConversationsProps {
  lastMessage?: ChatMessage;
  onResume: () => void;
}

export const RecentConversations: React.FC<RecentConversationsProps> = ({
  lastMessage,
  onResume,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Recent conversation</Text>
      {lastMessage ? (
        <AppCard onPress={onResume} style={styles.card} padding={Spacing.md}>
          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.sunshineYellow} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {lastMessage.role === 'user' ? 'You said:' : 'Sunny said:'}
              </Text>
              <Text style={styles.snippet} numberOfLines={2}>
                {lastMessage.content}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={Colors.sunshineYellow} />
          </View>
        </AppCard>
      ) : (
        <AppCard style={styles.emptyCard} padding={Spacing.md}>
          <Text style={styles.emptyText}>
            No past conversations yet. Tap "Talk to Sunny" above to get started!
          </Text>
        </AppCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  card: {
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.yellowSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  snippet: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
