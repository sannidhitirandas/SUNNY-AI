import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useMemories } from '@/context/MemoryContext';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { MemoryModal } from '@/components/memories/MemoryModal';
import { MemoryCategory } from '@/types/memory';
import { Bookmark, HeartHandshake, Trash2, X, AlertTriangle } from 'lucide-react';

interface ChatScreenProps {
  onNavigateToTab: (tab: 'home' | 'chat' | 'memories' | 'settings') => void;
  onNavigateToSafety?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onNavigateToTab,
  onNavigateToSafety,
}) => {
  const { messages, isThinking, lastError, sendMessage, retryMessage, clearChat } = useChat();
  const { preferences } = usePreferences();
  const { addMemory } = useMemories();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const [memoryInitialContent, setMemoryInitialContent] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleClearConfirm = async () => {
    setOptionsVisible(false);
    if (window.confirm('Clear Conversation?\nThis will reset your current conversation with Sunny. (Saved memories in your vault remain unaffected.)')) {
      await clearChat();
    }
  };

  const handleOpenSaveMemory = (content: string) => {
    setMemoryInitialContent(content);
    setMemoryModalVisible(true);
  };

  const handleSaveMemoryModal = async (data: {
    title: string;
    content: string;
    category: MemoryCategory;
    userConfirmed: boolean;
  }) => {
    await addMemory(data);
  };

  const formattedTone = preferences.preferredTone.charAt(0).toUpperCase() + preferences.preferredTone.slice(1);

  return (
    <div className="flex-1 flex flex-col h-full max-w-xl mx-auto w-full bg-[#100B22] relative pb-16 sm:pb-20">
      <ChatHeader
        onOptionsPress={() => setOptionsVisible(true)}
        preferredTone={formattedTone}
      />

      {/* Global Error Banner if connection failed */}
      {lastError && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-[#FF8D9A]/15 border border-[#FF8D9A]/30 flex items-center justify-between text-xs text-[#FF8D9A]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{lastError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const lastUser = [...messages].reverse().find((m) => m.role === 'user');
              if (lastUser) retryMessage(lastUser.id);
            }}
            className="font-bold underline cursor-pointer ml-2 hover:opacity-80 shrink-0"
          >
            Retry now
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1">
        {messages.map((item) => (
          <MessageBubble
            key={item.id}
            message={item}
            onRetry={retryMessage}
            onSaveAsMemory={preferences.memoryEnabled ? handleOpenSaveMemory : undefined}
          />
        ))}

        {isThinking && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer onSend={sendMessage} disabled={isThinking} />

      {/* Options Menu Modal */}
      {optionsVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#392858]">
              <h3 className="text-base font-bold text-white">Chat Options</h3>
              <button
                type="button"
                onClick={() => setOptionsVisible(false)}
                className="p-1 rounded-lg text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setOptionsVisible(false);
                  onNavigateToTab('memories');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#302149] text-white text-sm font-medium transition-colors text-left cursor-pointer"
              >
                <Bookmark size={18} className="text-[#FFD84D]" />
                <span>View Saved Memories Vault</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOptionsVisible(false);
                  if (onNavigateToSafety) {
                    onNavigateToSafety();
                  } else {
                    onNavigateToTab('settings');
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#302149] text-white text-sm font-medium transition-colors text-left cursor-pointer"
              >
                <HeartHandshake size={18} className="text-[#FF8D9A]" />
                <span>Emotional Safety & Crisis Resources</span>
              </button>

              <div className="pt-2 border-t border-[#392858]">
                <button
                  type="button"
                  onClick={handleClearConfirm}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FF8D9A]/15 text-[#FF8D9A] text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <Trash2 size={18} />
                  <span>Clear Conversation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save memory modal */}
      <MemoryModal
        visible={memoryModalVisible}
        editingMemory={
          memoryInitialContent
            ? {
                id: '',
                userId: '',
                title: 'Note from conversation',
                content: memoryInitialContent,
                category: 'personal',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userConfirmed: true,
              }
            : null
        }
        onClose={() => setMemoryModalVisible(false)}
        onSave={handleSaveMemoryModal}
      />
    </div>
  );
};
