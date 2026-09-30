import { chatService } from '@/services/chatService';
import { ChatMessage, StarterIntent } from '@/types/chat';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useMemories } from './MemoryContext';
import { usePreferences } from './PreferencesContext';

interface ChatContextType {
  messages: ChatMessage[];
  isThinking: boolean;
  lastError: string | null;
  activeIntent: StarterIntent | null;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (id: string) => Promise<void>;
  clearChat: () => Promise<void>;
  startConversationWithIntent: (intent: StarterIntent) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const { memories } = useMemories();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [activeIntent, setActiveIntent] = useState<StarterIntent | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadChatMessages = async () => {
      try {
        const loaded = await chatService.getMessages('default-session');
        if (mounted) setMessages(loaded);
      } catch (error) {
        console.warn('[ChatContext] Error loading cloud chat:', error);
        if (mounted) setMessages([]);
      }
    };

    void loadChatMessages();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadChatMessages();
      } else if (mounted) {
        setMessages([]);
        setActiveIntent(null);
        setLastError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const startConversationWithIntent = async (intent: StarterIntent) => {
    setActiveIntent(intent);
    const starterPrompt = chatService.getStarterGreeting(intent, preferences.preferredTone);

    const starterMessage: ChatMessage = {
      id: `starter-${Date.now()}`,
      sessionId: 'default-session',
      role: 'assistant',
      content: starterPrompt,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'sent',
      isDemoResponse: false,
      model: 'sunny',
    };

    const updated = [...messages, starterMessage];
    setMessages(updated);
    await chatService.saveMessages('default-session', updated);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setLastError(null);

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
      await chatService.saveMessages('default-session', updatedWithUser);

      const aiResult = await chatService.sendMessageToAI({
        message: content.trim(),
        history: updatedWithUser,
        tone: preferences.preferredTone,
        preferredName: preferences.preferredName,
        memoryEnabled: preferences.memoryEnabled,
        memories: preferences.memoryEnabled ? memories : [],
        sessionId: 'default-session',
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sessionId: 'default-session',
        role: 'assistant',
        content: aiResult.text,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'sent',
        isDemoResponse: false,
      };

      const finalMessages = [...updatedWithUser, aiMessage];
      setMessages(finalMessages);
      await chatService.saveMessages('default-session', finalMessages);
    } catch (err: any) {
      console.error('[ChatContext] Error sending message:', err);
      const errorMsg = err?.message || 'Failed to connect to Sunny. Please check your connection and tap retry.';
      setLastError(errorMsg);
      setMessages(updatedWithUser);

      try {
        await chatService.saveMessages('default-session', updatedWithUser);
      } catch (saveError) {
        console.error('[ChatContext] Error saving user message:', saveError);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const retryMessage = async (id: string) => {
    const target = messages.find((m) => m.id === id);
    if (!target) return;

    const filtered = messages.filter((m) => m.id !== id);
    setMessages(filtered);
    await sendMessage(target.content);
  };

  const clearChat = async () => {
    await chatService.clearMessages('default-session');
    const fresh = await chatService.getMessages('default-session');
    setMessages(fresh);
    setActiveIntent(null);
    setLastError(null);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isThinking,
        lastError,
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
