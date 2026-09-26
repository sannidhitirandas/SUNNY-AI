import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChat } from '@/context/ChatContext';
import { ChatMessage } from '@/types/chat';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const router = useRouter();
  const { messages, isThinking, sendMessage, retryMessage, clearChat } = useChat();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [optionsVisible, setOptionsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Scroll to bottom on new message
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isThinking]);

  const handleSend = (text: string) => {
    sendMessage(text);
  };

  const handleClearConfirm = () => {
    setOptionsVisible(false);
    Alert.alert(
      'Clear Conversation?',
      'This will reset your current conversation with Sunny. (Saved memories remain unaffected.)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Chat',
          style: 'destructive',
          onPress: async () => {
            await clearChat();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ChatHeader
        onOptionsPress={() => setOptionsVisible(true)}
        isDemoMode={true}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} onRetry={retryMessage} />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isThinking ? <TypingIndicator /> : null}
        />

        <MessageComposer onSend={handleSend} disabled={isThinking} />
      </KeyboardAvoidingView>

      {/* Options Menu Modal */}
      <Modal visible={optionsVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOptionsVisible(false)}
          style={styles.modalOverlay}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Chat Options</Text>
              <TouchableOpacity onPress={() => setOptionsVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                router.push('/(tabs)/memories');
              }}
              style={styles.optionItem}
            >
              <Ionicons name="bookmark-outline" size={20} color={Colors.sunshineYellow} />
              <Text style={styles.optionText}>View Saved Memories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                router.push('/settings/safety');
              }}
              style={styles.optionItem}
            >
              <Ionicons name="heart-half-outline" size={20} color="#FF8D9A" />
              <Text style={styles.optionText}>Emotional Safety & Crisis Resources</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearConfirm}
              style={[styles.optionItem, styles.dangerOptionItem]}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[styles.optionText, styles.dangerOptionText]}>
                Clear Conversation
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messageList: {
    paddingVertical: Spacing.md,
    flexGrow: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  optionsSheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
  },
  optionsTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    ...Typography.bodyLarge,
    fontSize: 15,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  dangerOptionItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
    paddingTop: 14,
  },
  dangerOptionText: {
    color: Colors.error,
  },
});
