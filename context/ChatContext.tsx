import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatMessage, StarterIntent } from '@/types/chat';
import { chatService } from '@/services/chatService';
import { usePreferences } from './PreferencesContext';

interface ChatContextType {
  messages: ChatMessage[];
  isThinking: boolean;
  activeIntent: StarterIntent | null;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (id: string) => Promise<void>;
  clearChat: () => Promise<void>;
  startConversationWithIntent: (intent: StarterIntent) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeIntent, setActiveIntent] = useState<StarterIntent | null>(null);

  useEffect(() => {
    loadChatMessages();
  }, []);

  const loadChatMessages = async () => {
    const loaded = await chatService.getMessages('default-session');
    setMessages(loaded);
  };

  const startConversationWithIntent = async (intent: StarterIntent) => {
    setActiveIntent(intent);
    const starterPrompt = chatService.getStarterGreeting(intent, preferences.preferredTone);
    
    // Add Sunny starter prompt if chat is fresh or just started
    const starterMessage: ChatMessage = {
      id: `starter-${Date.now()}`,
      sessionId: 'default-session',
      role: 'assistant',
      content: starterPrompt,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'sent',
      isDemoResponse: true,
    };

    const updated = [...messages, starterMessage];
    setMessages(updated);
    await chatService.saveMessages('default-session', updated);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: 'default-session',
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      deliveryStatus: 'sent',
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    setIsThinking(true);

    try {
      // Save current state
      await chatService.saveMessages('default-session', updatedWithUser);

      // Generate demo AI response based on current tone
      const aiResponseText = await chatService.generateDemoResponse(
        content,
        preferences.preferredTone,
        'default-session'
      );

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sessionId: 'default-session',
        role: 'assistant',
        content: aiResponseText,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'sent',
        isDemoResponse: true,
      };

      const finalMessages = [...updatedWithUser, aiMessage];
      setMessages(finalMessages);
      await chatService.saveMessages('default-session', finalMessages);
    } catch (err) {
      console.warn('Error in sendMessage:', err);
      // Mark user message as failed if something went wrong
      const failedList = updatedWithUser.map((m) =>
        m.id === userMessage.id ? { ...m, deliveryStatus: 'failed' as const } : m
      );
      setMessages(failedList);
      await chatService.saveMessages('default-session', failedList);
    } finally {
      setIsThinking(false);
    }
  };

  const retryMessage = async (id: string) => {
    const target = messages.find((m) => m.id === id);
    if (!target) return;

    // Remove the failed message and re-send it
    const filtered = messages.filter((m) => m.id !== id);
    setMessages(filtered);
    await sendMessage(target.content);
  };

  const clearChat = async () => {
    await chatService.clearMessages('default-session');
    const fresh = await chatService.getMessages('default-session');
    setMessages(fresh);
    setActiveIntent(null);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isThinking,
        activeIntent,
        sendMessage,
        retryMessage,
        clearChat,
        startConversationWithIntent,
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
