import { chatService } from '@/services/chatService';
import { ChatMessage, StarterIntent } from '@/types/chat';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useMemories } from './MemoryContext';
import { usePreferences } from './PreferencesContext';
import {
  createVibeStarterMessage,
  nextVibeStarterTimestamp,
  normalizeHydratedVibeStarters,
} from '@/lib/vibeStarterMessages';
import {
  applyChatEntry,
  createNormalChatGreeting,
  type ChatEntrySource,
} from '@/lib/chatEntry';

interface ChatContextType {
  messages: ChatMessage[];
  isThinking: boolean;
  lastError: string | null;
  activeIntent: StarterIntent | null;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (id: string) => Promise<void>;
  clearChat: () => Promise<void>;
  enterChat: (entry: ChatEntrySource) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const { memories, refreshMemories, applyAutomaticGuestMemories } = useMemories();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [activeIntent, setActiveIntent] = useState<StarterIntent | null>(null);
  const loadRequestRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  const hydratedRef = useRef(false);
  const hydrationPromiseRef = useRef<Promise<void> | null>(null);
  const starterPersistenceRef = useRef<Promise<void>>(Promise.resolve());

  const updateMessages = (nextMessages: ChatMessage[]) => {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  };

  const ensureMessagesHydrated = () => {
    if (hydratedRef.current) return Promise.resolve();
    if (hydrationPromiseRef.current) return hydrationPromiseRef.current;

    const requestId = ++loadRequestRef.current;
    const loading = chatService.getMessages('default-session')
      .then((loaded) => {
        if (requestId !== loadRequestRef.current) return;
        const hydratedMessages = normalizeHydratedVibeStarters(loaded);
        updateMessages(hydratedMessages);
        hydratedRef.current = true;
      })
      .catch((error) => {
        console.warn('[ChatContext] Error loading cloud chat:', error);
      })
      .finally(() => {
        if (hydrationPromiseRef.current === loading) hydrationPromiseRef.current = null;
      });

    hydrationPromiseRef.current = loading;
    return loading;
  };

  useEffect(() => {
    let mounted = true;

    const loadChatMessages = async () => {
      await ensureMessagesHydrated();
    };

    void loadChatMessages();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      loadRequestRef.current += 1;
      hydratedRef.current = false;
      hydrationPromiseRef.current = null;
      if (mounted) updateMessages([]);
      if (session?.user) {
        window.setTimeout(() => {
          if (mounted) void loadChatMessages();
        }, 0);
      } else if (mounted) {
        setActiveIntent(null);
        setLastError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const enterChat = async (entry: ChatEntrySource) => {
    await ensureMessagesHydrated();
    const entryStarter = entry.source === 'vibe'
      ? createVibeStarterMessage(
          entry.selectedVibe,
          `starter-${entry.selectedVibe}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          nextVibeStarterTimestamp(messagesRef.current)
        )
      : createNormalChatGreeting(
          `starter-normal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          nextVibeStarterTimestamp(messagesRef.current)
        );
    setActiveIntent(entry.source === 'vibe' ? entry.selectedVibe : null);

    const { messages: updated, changed } = applyChatEntry(
      messagesRef.current,
      entry,
      entryStarter
    );
    if (!changed) return;
    updateMessages(updated);

    if (!hydratedRef.current) return;

    const persistence = starterPersistenceRef.current.then(async () => {
      await chatService.saveMessages('default-session', updated);
    });
    starterPersistenceRef.current = persistence.catch((error) => {
      console.warn('[ChatContext] Could not persist selected vibe starter:', error);
    });
    await starterPersistenceRef.current;
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
    updateMessages(updatedWithUser);
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

      if (aiResult.memoriesUpdated) {
        try {
          await refreshMemories();
        } catch (memoryError) {
          console.warn('[ChatContext] Could not refresh saved memories:', memoryError);
        }
      } else if (aiResult.memoryUpdates.length > 0) {
        try {
          await applyAutomaticGuestMemories(aiResult.memoryUpdates, 'default-session');
        } catch (memoryError) {
          console.warn('[ChatContext] Could not save guest memories:', memoryError);
        }
      }

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
      updateMessages(finalMessages);
      await chatService.saveMessages('default-session', finalMessages);
    } catch (err: any) {
      console.error('[ChatContext] Error sending message:', err);
      const errorMsg = err?.message || 'Failed to connect to Sunny. Please check your connection and tap retry.';
      setLastError(errorMsg);
      updateMessages(updatedWithUser);

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
    updateMessages(filtered);
    await sendMessage(target.content);
  };

  const clearChat = async () => {
    await chatService.clearMessages('default-session');
    const fresh = await chatService.getMessages('default-session');
    updateMessages(normalizeHydratedVibeStarters(fresh));
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
        enterChat,
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
