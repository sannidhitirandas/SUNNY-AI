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
import { getPersonalityLabel } from '@/types/user';
import { CHAT_BACKGROUNDS, useChatBackground } from '@/lib/chatBackground';
import { Bookmark, HeartHandshake, Trash2, X, AlertTriangle, ImageIcon, CheckCircle2 } from 'lucide-react';

interface ChatScreenProps {
  onNavigateToTab: (tab: 'home' | 'chat' | 'memories' | 'settings') => void;
  onNavigateToSafety?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isKeyboardVisible?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onNavigateToTab,
  onNavigateToSafety,
  onFocus,
  onBlur,
  isKeyboardVisible = false,
}) => {
  const { messages, isThinking, isLoadingOlderMessages, hasOlderMessages, loadOlderMessages, lastError, sendMessage, retryMessage, clearChat } = useChat();
  const { preferences } = usePreferences();
  const { addMemory } = useMemories();
  const { background, setChatBackground } = useChatBackground();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const [memoryInitialContent, setMemoryInitialContent] = useState('');

  useEffect(() => {
    const scrollArea = messagesScrollRef.current;
    const previous = preserveScrollRef.current;
    if (scrollArea && previous) {
      scrollArea.scrollTop = previous.top + (scrollArea.scrollHeight - previous.height);
      preserveScrollRef.current = null;
      return;
    }
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

  const formattedTone = getPersonalityLabel(preferences.preferredTone);

  return (
<div className="relative isolate mx-auto flex h-full min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden bg-[#100B22] px-0 pb-16 sm:px-3 sm:pb-16 lg:rounded-3xl lg:border lg:border-[#392858]/70 lg:pb-8 lg:shadow-[0_24px_80px_rgba(0,0,0,0.18)]">

      {/* Chat wallpaper: image + theme-aware veil so message text stays readable */}
      {background.pc && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:rounded-3xl">
          {/* Phones in portrait get the tall wallpaper; PCs and landscape get the wide one */}
          <picture>
            {background.mobile && <source media="(orientation: portrait)" srcSet={background.mobile} />}
            <img
              src={background.pc ?? undefined}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>
          <div
            className="absolute inset-0"
            style={{
              background:
                preferences.theme === 'sunny-light'
                  ? 'linear-gradient(to bottom, rgba(248,246,252,0.72), rgba(248,246,252,0.82))'
                  : 'linear-gradient(to bottom, rgba(16,11,34,0.45), rgba(16,11,34,0.70))',
            }}
          />
        </div>
      )}

      <ChatHeader
        onOptionsPress={() => setOptionsVisible(true)}
        preferredTone={formattedTone}
      />

      {/* AI response error — the user's message remains delivered */}
      {lastError && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-[#FF8D9A]/15 border border-[#FF8D9A]/30 flex items-center justify-between text-xs text-[#FF8D9A]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>Sunny couldn't respond just now. {lastError}</span>
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
      <div ref={messagesScrollRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(48,33,73,0.18),transparent_55%)] py-4 sm:py-6">
        {hasOlderMessages && (
          <div className="flex justify-center px-4 pb-3">
            <button
              type="button"
              disabled={isLoadingOlderMessages}
              onClick={() => {
                const area = messagesScrollRef.current;
                if (area) preserveScrollRef.current = { height: area.scrollHeight, top: area.scrollTop };
                void loadOlderMessages();
              }}
              className="rounded-full border border-[#392858] bg-[#21163A] px-4 py-2 text-xs font-medium text-[#D7C8F5] transition-colors hover:bg-[#302149] disabled:cursor-wait disabled:opacity-60"
            >
              {isLoadingOlderMessages ? 'Loading older messages…' : 'Load older messages'}
            </button>
          </div>
        )}
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
      <MessageComposer
        onSend={sendMessage}
        disabled={isThinking}
        onFocus={onFocus}
        onBlur={onBlur}
        isKeyboardVisible={isKeyboardVisible}
      />

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
                  setBackgroundModalVisible(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#302149] text-white text-sm font-medium transition-colors text-left cursor-pointer"
              >
                <ImageIcon size={18} className="text-[#FFD84D]" />
                <span>Change Chat Wallpaper</span>
                <span className="ml-auto text-xs text-[#C6B8E5]">{background.label}</span>
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

      {backgroundModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="chat-bg-picker-title" className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#21163A] border border-[#392858] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 id="chat-bg-picker-title" className="text-base font-bold text-white mb-3">Chat background</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {CHAT_BACKGROUNDS.map((item) => {
                const isSelected = background.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setChatBackground(item.id)}
                    className={`relative overflow-hidden rounded-2xl border text-left transition-colors cursor-pointer ${
                      isSelected ? 'border-[#FFD84D] ring-2 ring-[#FFD84D]/60' : 'border-[#392858] hover:border-white/30'
                    }`}
                  >
                    <div
                      className="h-24 w-full bg-[#100B22] bg-cover bg-center"
                      style={item.thumb ? { backgroundImage: `url(${item.thumb})` } : undefined}
                    />
                    <div className="flex items-center justify-between bg-[#302149] px-3 py-2">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-[#FFD84D]' : 'text-white'}`}>{item.label}</span>
                      {isSelected && <CheckCircle2 size={16} className="text-[#FFD84D] shrink-0 ml-2" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setBackgroundModalVisible(false)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-[#FFD84D] hover:bg-[#FFD84D]/10 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
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
