import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useMemories } from '@/context/MemoryContext';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { MemoryModal } from '@/components/memories/MemoryModal';
import { VoiceConversationScreen } from '@/components/chat/VoiceConversationScreen';
import { MemoryCategory } from '@/types/memory';
import { SunnySun } from '@/components/brand/SunnySun';
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
  /** True when the bottom nav dock is hidden, so the chat can reclaim its space. */
  isNavHidden?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onNavigateToTab,
  onNavigateToSafety,
  onFocus,
  onBlur,
  isKeyboardVisible = false,
  isNavHidden,
}) => {
  const navHidden = isNavHidden ?? isKeyboardVisible;
  const { messages, isThinking, isLoadingOlderMessages, hasOlderMessages, loadOlderMessages, lastError, activeIntent, setActiveIntent, sendMessage, retryMessage, clearChat } = useChat();
  const { preferences } = usePreferences();
  const { addMemory } = useMemories();
  const { background, wallpaperSrc, bubbleGradient, setChatBackground, availableBackgrounds, device } = useChatBackground();

  // Wallpaper-matched bubble backgrounds (Sunny's and yours), handed to CSS as variables.
  // Only on when a wallpaper is picked; "Plain" keeps the normal bubble colours.
  const bubbleColors = bubbleGradient ? (preferences.theme === 'sunny-light' ? bubbleGradient.light : bubbleGradient.dark) : null;
  const gradientStyle = bubbleColors
    ? ({
        '--sunny-bot-1': bubbleColors.sunny[0],
        '--sunny-bot-2': bubbleColors.sunny[1],
        '--sunny-bot-3': bubbleColors.sunny[2],
        '--sunny-you-1': bubbleColors.you[0],
        '--sunny-you-2': bubbleColors.you[1],
        '--sunny-you-3': bubbleColors.you[2],
        '--sunny-you-fg': bubbleColors.youText,
      } as React.CSSProperties)
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
  const [voiceModeVisible, setVoiceModeVisible] = useState(false);

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
<div style={gradientStyle} className={`sunny-chat-ui ${bubbleColors ? 'sunny-bubbles-on ' : ''}relative isolate flex h-full min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden bg-[#12051F] px-0 ${backgroundModalVisible || personalityModalVisible || optionsVisible || memoryModalVisible ? 'z-[60]' : 'z-0'} ${navHidden ? 'pb-0' : 'pb-16 lg:pb-24'} transition-[padding] duration-300 ease-out sm:px-0 lg:rounded-none lg:border-0 lg:shadow-none`}>

      <style>{`
        .sunny-chat-ui {
          background:
            radial-gradient(ellipse at 50% -12%,rgba(126,83,190,.22),transparent 48%),
            linear-gradient(160deg,#12051F 0%,#1A0A2E 52%,#14061F 100%) !important;
        }
        .sunny-chat-ui .chat-message-list {
          background: radial-gradient(ellipse at top,rgba(139,92,246,.13),transparent 58%) !important;
        }
        .sunny-chat-ui .sunny-modal-surface {
          background:linear-gradient(145deg,#2D1450,#1E0B33) !important;
          border-color:rgba(167,139,250,.28) !important;
          box-shadow:0 28px 80px rgba(5,2,14,.55),inset 0 1px 0 rgba(255,255,255,.07) !important;
        }
        .sunny-chat-ui .sunny-modal-overlay { background:rgba(12,7,23,.82) !important; }
        .sunny-chat-ui button:focus-visible { outline:2px solid #C4B5FD; outline-offset:3px; }
        .sunny-chat-ui :where(button:not([class*="text-[#FF8D9A]"])):hover {
          border-color:rgba(185,154,255,.55);
        }
        .sunny-chat-ui .sunny-chat-header .sunny-chat-avatar {\n          border-color:rgba(232,121,249,.32) !important;\n          color:#E879F9 !important;\n          background:linear-gradient(135deg,rgba(232,121,249,.16),rgba(139,92,246,.16)) !important;\n        }\n        .sunny-chat-ui .sunny-chat-header .sunny-chat-avatar svg { color:#E879F9 !important; }\n        .sunny-chat-ui .sunny-composer { border-color:rgba(232,121,249,.24) !important; }\n        .sunny-chat-ui .sunny-send-button:not(:disabled) { background:linear-gradient(135deg,#E879F9,#DDAE50) !important; color:#2A1347 !important; box-shadow:0 4px 18px rgba(232,121,249,.18) !important; }\n        .sunny-chat-ui .sunny-chat-header,
        .sunny-chat-ui .sunny-message-composer {
          border-color:rgba(167,139,250,.2);
        }
        :root[data-theme='sunny-light'] .sunny-chat-ui {
          background:linear-gradient(160deg,#F8F6FC,#F0EAF8 58%,#F8F5FC) !important;
        }
        :root[data-theme='sunny-light'] .sunny-chat-ui .sunny-modal-surface {
          background:linear-gradient(145deg,#FFFFFF,#F2EBFC) !important;
          border-color:rgba(91,67,120,.2) !important;
        }
      `}</style>

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
                  : 'linear-gradient(to bottom, rgba(18,5,31,0.38), rgba(18,5,31,0.62))',
            }}
          />
        </div>
      )}

      <ChatHeader
        onVoicePress={() => setVoiceModeVisible(true)}
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
        {messages.length === 0 && !isThinking && (
          <section className="sunny-chat-welcome mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center px-5 py-7 text-center sm:px-8" aria-label="Start a conversation with Sunny">
            <div className="relative mb-3 h-36 w-40 sm:h-44 sm:w-48">
              <SunnySun compact className="relative z-10 h-full w-full" />
            </div>
            <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E879F9]/25 bg-[#E879F9]/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#E879F9]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E879F9] shadow-[0_0_10px_rgba(232,121,249,.8)]"/> Here with you
            </span>
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">What would you like to talk about?</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#D6C2F2]">Start anywhere. Sunny is here to listen, help you think, or simply keep you company.</p>
            <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { label: 'Help me unwind', prompt: 'I want to unwind. Can you help me slow down and feel a little calmer?' },
                { label: 'I need a fresh perspective', prompt: 'I have something on my mind and would like a fresh perspective.' },
                { label: 'Let’s talk about my day', prompt: 'Can we talk about my day? I would like to share what happened.' },
              ].map((item) => (
                <button key={item.label} type="button" onClick={() => void sendMessage(item.prompt, [])} className="group rounded-2xl border border-[#A78BFA]/25 bg-gradient-to-br from-[#381A60]/90 to-[#1E0B33]/90 px-4 py-3 text-left text-xs font-semibold text-[#F1E9FF] shadow-[0_8px_24px_rgba(0,0,0,.12)] transition-all hover:-translate-y-0.5 hover:border-[#E879F9]/50 hover:bg-[#4A2A73] active:scale-[.99]">
                  <span>{item.label}</span>
                  <span className="mt-2 block text-[#E879F9] transition-transform group-hover:translate-x-1">↗</span>
                </button>
              ))}
            </div>
          </section>
        )}
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
              className="rounded-full border border-[#4A2A73] bg-[#25103F] px-4 py-2 text-xs font-medium text-[#E5D9FF] transition-colors hover:bg-[#381A60] disabled:cursor-wait disabled:opacity-60"
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
        onVoicePress={() => setVoiceModeVisible(true)}
        disabled={isThinking}
        placeholder={isThinking ? 'Sunny is replying…' : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
        isKeyboardVisible={isKeyboardVisible}
      />

      {personalityModalVisible && (
        <div className="sunny-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12051F]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="personality-picker-title" className="sunny-modal-surface w-full max-w-sm bg-[#25103F] border border-[#4A2A73] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 id="personality-picker-title" className="text-base font-bold text-white">Choose Sunny's personality</h3>
                <p className="mt-1 text-xs text-[#D2C5E8]">Switch whenever you like. Your conversation stays right here.</p>
              </div>
              <button type="button" onClick={() => setPersonalityModalVisible(false)} className="p-1 rounded-lg text-[#D2C5E8] hover:text-white" aria-label="Close personality picker">
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
                    className={`w-full rounded-2xl border p-3 text-left transition-colors ${selected ? 'border-[#B99AFF] bg-[#B99AFF]/10' : 'border-[#4A2A73] bg-[#381A60] hover:border-white/25'}`}
                  >
                    <span className={`block text-sm font-semibold ${selected ? 'text-[#B99AFF]' : 'text-white'}`}>{item.title}</span>
                    <span className="mt-0.5 block text-xs text-[#D2C5E8]">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Options Menu Modal */}
      {optionsVisible && (
        <div className="sunny-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12051F]/80 backdrop-blur-xs">
          <div className="sunny-modal-surface w-full max-w-sm bg-[#25103F] border border-[#4A2A73] rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#4A2A73]">
              <h3 className="text-base font-bold text-white">Chat Options</h3>
              <button
                type="button"
                onClick={() => setOptionsVisible(false)}
                className="p-1 rounded-lg text-[#D2C5E8] hover:text-white transition-colors cursor-pointer"
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#381A60] text-white text-sm font-medium transition-colors text-left cursor-pointer"
              >
                <Bookmark size={18} className="text-[#B99AFF]" />
                <span>View Saved Memories Vault</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOptionsVisible(false);
                  setBackgroundModalVisible(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#381A60] text-white text-sm font-medium transition-colors text-left cursor-pointer"
              >
                <ImageIcon size={18} className="text-[#B99AFF]" />
                <span>Change Chat Wallpaper</span>
                <span className="ml-auto text-xs text-[#D2C5E8]">{background.label}</span>
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#381A60] text-white text-sm font-medium transition-colors text-left cursor-pointer"
              >
                <HeartHandshake size={18} className="text-[#FF8D9A]" />
                <span>Emotional Safety & Crisis Resources</span>
              </button>

              <div className="pt-2 border-t border-[#4A2A73]">
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
        <div className="sunny-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12051F]/80 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="chat-bg-picker-title" className="sunny-modal-surface w-full max-w-md max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain bg-[#25103F] border border-[#4A2A73] rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 id="chat-bg-picker-title" className="text-base font-bold text-white mb-1">Chat background</h3>
            <p className="text-xs text-[#D2C5E8] mb-3">{device === 'mobile' ? 'Mobile wallpapers' : 'Desktop wallpapers'} · Saved separately on this device</p>
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
                      isSelected ? 'border-[#B99AFF] ring-2 ring-[#B99AFF]/60' : 'border-[#4A2A73] hover:border-white/30'
                    }`}
                  >
                    <div
                      className="h-24 w-full bg-[#12051F] bg-cover bg-center"
                      style={item.thumb ? { backgroundImage: `url(${item.thumb})` } : undefined}
                    />
                    <div className="flex items-center justify-between bg-[#381A60] px-3 py-2">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-[#B99AFF]' : 'text-white'}`}>{item.label}</span>
                      {isSelected && <CheckCircle2 size={16} className="text-[#B99AFF] shrink-0 ml-2" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setBackgroundModalVisible(false)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-[#B99AFF] hover:bg-[#B99AFF]/10 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {voiceModeVisible && (
        <VoiceConversationScreen
          messages={messages}
          isThinking={isThinking}
          sendMessage={sendMessage}
          onClose={() => setVoiceModeVisible(false)}
        />
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
