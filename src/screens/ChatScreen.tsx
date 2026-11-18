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
import type { StarterIntent } from '@/types/chat';
import { useChatBackground } from '@/lib/chatBackground';
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
  const { messages, isThinking, isLoadingOlderMessages, hasOlderMessages, loadOlderMessages, lastError, activeIntent, setActiveIntent, sendMessage, retryMessage, clearChat } = useChat();
  const { preferences } = usePreferences();
  const { addMemory } = useMemories();
  const { background, wallpaperSrc, textGradient, setChatBackground, availableBackgrounds, device } = useChatBackground();

  // Wallpaper-matched gradient for Sunny's message text, handed to CSS as variables.
  // Only on when a wallpaper is picked; "Plain" keeps the normal solid text colour.
  const gradientStops = textGradient ? (preferences.theme === 'sunny-light' ? textGradient.light : textGradient.dark) : null;
  const gradientStyle = gradientStops
    ? ({ '--sunny-text-1': gradientStops[0], '--sunny-text-2': gradientStops[1], '--sunny-text-3': gradientStops[2] } as React.CSSProperties)
    : undefined;

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
  // True while the user is at (or near) the bottom. If they scroll up to re-read,
  // streaming text will no longer yank them back down.
  const stickToBottomRef = useRef(true);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [personalityModalVisible, setPersonalityModalVisible] = useState(false);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const [memoryInitialContent, setMemoryInitialContent] = useState('');

  const handleScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    const scrollArea = messagesScrollRef.current;
    if (!scrollArea) return;

    // Restore position after "Load older messages".
    const previous = preserveScrollRef.current;
    if (previous) {
      scrollArea.scrollTop = previous.top + (scrollArea.scrollHeight - previous.height);
      preserveScrollRef.current = null;
      return;
    }

    const last = messages[messages.length - 1];
    const justSent = last?.role === 'user';
    if (justSent) stickToBottomRef.current = true;
    if (!stickToBottomRef.current) return;

    // Smooth when the user sends, instant while Sunny's reply streams (no jitter).
    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior: justSent ? 'smooth' : 'auto',
    });
  }, [messages, isThinking]);

  // When the keyboard opens or closes the list is resized; keep the newest
  // message anchored at the bottom instead of letting it slide under the keyboard.
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  // Show the dots only until the first streamed token arrives.
  const showTyping = isThinking && messages[messages.length - 1]?.role !== 'assistant';

  return (
<div style={gradientStyle} className={`${gradientStops ? 'sunny-text-gradient-on ' : ''}relative isolate flex h-full min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden bg-[#100B22] px-0 ${backgroundModalVisible || personalityModalVisible || optionsVisible || memoryModalVisible ? 'z-[60]' : 'z-0'} ${isKeyboardVisible ? 'pb-0' : 'pb-16'} sm:px-0 sm:pb-16 lg:rounded-none lg:border-0 lg:pb-24 lg:shadow-none`}>

      {/* Chat wallpaper: image + theme-aware veil so message text stays readable */}
      {wallpaperSrc && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:rounded-3xl">
          {/* Same `device` rule as the picker: mobile set on phones/tablets, PC set on desktop */}
          <img
            key={wallpaperSrc}
            src={wallpaperSrc}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
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
        onPersonalityPress={() => setPersonalityModalVisible(true)}
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
      <div
        ref={messagesScrollRef}
        onScroll={handleScroll}
        className="chat-message-list min-h-0 flex-1 space-y-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(48,33,73,0.18),transparent_55%)] pb-4 pt-1 sm:pb-5 sm:pt-2"
      >
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
        {messages.map((item, index) => {
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const isSameGroup = (a: typeof item | undefined, b: typeof item | undefined) => {
            if (!a || !b || a.role !== b.role) return false;
            const aTime = Date.parse(a.createdAt);
            const bTime = Date.parse(b.createdAt);
            return Number.isFinite(aTime) && Number.isFinite(bTime) && Math.abs(bTime - aTime) <= 5 * 60 * 1000;
          };

          return (
            <MessageBubble
              key={item.id}
              message={item}
              isFirstInGroup={!isSameGroup(previous, item)}
              isLastInGroup={!isSameGroup(item, next)}
              onRetry={retryMessage}
              onSaveAsMemory={preferences.memoryEnabled ? handleOpenSaveMemory : undefined}
            />
          );
        })}

        {showTyping && <TypingIndicator />}
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSend={sendMessage}
        disabled={isThinking}
        placeholder={isThinking ? 'Sunny is replying…' : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
        isKeyboardVisible={isKeyboardVisible}
      />

      {personalityModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100B22]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="personality-picker-title" className="w-full max-w-sm bg-[#21163A] border border-[#392858] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 id="personality-picker-title" className="text-base font-bold text-white">Choose Sunny's personality</h3>
                <p className="mt-1 text-xs text-[#C6B8E5]">Switch whenever you like. Your conversation stays right here.</p>
              </div>
              <button type="button" onClick={() => setPersonalityModalVisible(false)} className="p-1 rounded-lg text-[#C6B8E5] hover:text-white" aria-label="Close personality picker">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {([
                { intent: 'listen', title: 'Listen & Support', description: 'A patient space to talk things through.' },
                { intent: 'laugh', title: 'Make Me Laugh', description: 'Playful chats, silly ideas and fun distractions.' },
                { intent: 'encourage', title: 'Encouragement', description: 'Gentle confidence and realistic next steps.' },
                { intent: 'anything', title: 'Anything Goes', description: 'A natural mix of curiosity, warmth and fun.' },
              ] as { intent: StarterIntent; title: string; description: string }[]).map((item) => {
                const selected = activeIntent === item.intent;
                return (
                  <button
                    key={item.intent}
                    type="button"
                    aria-pressed={selected}
                    onClick={async () => {
                      await setActiveIntent(item.intent);
                      setPersonalityModalVisible(false);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition-colors ${selected ? 'border-[#FFD84D] bg-[#FFD84D]/10' : 'border-[#392858] bg-[#302149] hover:border-white/25'}`}
                  >
                    <span className={`block text-sm font-semibold ${selected ? 'text-[#FFD84D]' : 'text-white'}`}>{item.title}</span>
                    <span className="mt-0.5 block text-xs text-[#C6B8E5]">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
          <div role="dialog" aria-modal="true" aria-labelledby="chat-bg-picker-title" className="w-full max-w-md max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain bg-[#21163A] border border-[#392858] rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 id="chat-bg-picker-title" className="text-base font-bold text-white mb-1">Chat background</h3>
            <p className="text-xs text-[#C6B8E5] mb-3">{device === 'mobile' ? 'Mobile wallpapers' : 'Desktop wallpapers'} · Saved separately on this device</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {availableBackgrounds.map((item) => {
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