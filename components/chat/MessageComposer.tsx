import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = "Tell Sunny what's on your mind...",
}) => {
  const [text, setText] = useState<string>('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    const toSend = text;
    setText('');
    onSend(toSend);
  };

  const isSendDisabled = disabled || text.trim().length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputCard}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
          editable={!disabled}
          style={styles.textInput}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={isSendDisabled}
          activeOpacity={0.8}
          style={[
            styles.sendButton,
            isSendDisabled ? styles.sendButtonDisabled : styles.sendButtonActive,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={isSendDisabled ? Colors.textMuted : Colors.textDark}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? Spacing.sm : Spacing.md,
    backgroundColor: Colors.secondaryBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    ...Typography.bodyLarge,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingRight: Spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: Colors.sunshineYellow,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
