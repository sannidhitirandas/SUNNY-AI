import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatMessage } from '@/types/chat';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { SunnyLogo } from '../brand/SunnyLogo';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.userTime}>{formatTime(message.createdAt)}</Text>
            {message.deliveryStatus === 'sending' && (
              <Ionicons name="time-outline" size={13} color="rgba(16, 11, 34, 0.6)" style={styles.statusIcon} />
            )}
            {message.deliveryStatus === 'sent' && (
              <Ionicons name="checkmark-done" size={14} color="rgba(16, 11, 34, 0.7)" style={styles.statusIcon} />
            )}
            {message.deliveryStatus === 'failed' && (
              <TouchableOpacity
                onPress={() => onRetry && onRetry(message.id)}
                style={styles.retryRow}
                accessibilityLabel="Retry failed message"
              >
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Sunny message
  return (
    <View style={styles.sunnyContainer}>
      <View style={styles.avatar}>
        <SunnyLogo size="small" />
      </View>
      <View style={styles.sunnyBubble}>
        <Text style={styles.sunnyText}>{message.content}</Text>
        <View style={styles.sunnyMetaRow}>
          <Text style={styles.sunnyTime}>{formatTime(message.createdAt)}</Text>
          {message.isDemoResponse && (
            <View style={styles.demoTag}>
              <Text style={styles.demoTagText}>Demo</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userContainer: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  userBubble: {
    backgroundColor: Colors.sunshineYellow,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
    shadowColor: Colors.sunshineYellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  userText: {
    ...Typography.bodyLarge,
    color: Colors.textDark,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  userTime: {
    ...Typography.caption,
    fontSize: 10,
    color: 'rgba(16, 11, 34, 0.65)',
  },
  statusIcon: {
    marginLeft: 4,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  retryText: {
    ...Typography.caption,
    color: Colors.error,
    marginLeft: 2,
    fontWeight: '700',
  },
  sunnyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  avatar: {
    marginRight: Spacing.sm,
    marginBottom: 4,
  },
  sunnyBubble: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
  },
  sunnyText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  sunnyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sunnyTime: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textMuted,
  },
  demoTag: {
    backgroundColor: 'rgba(255, 216, 77, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  demoTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.sunshineYellow,
  },
});
