import React from 'react';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useChat } from '@/context/ChatContext';
import type { ChatEntrySource } from '@/lib/chatEntry';
import { StarterIntent } from '@/types/chat';

import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { GreetingCard } from '@/components/home/GreetingCard';
import { ConversationStarter } from '@/components/home/ConversationStarter';
import { RecentConversations } from '@/components/home/RecentConversations';

import { Settings, Sparkles, MessageCircle, Bookmark, ArrowUpRight } from 'lucide-react';

interface HomeScreenProps {
  onNavigateToTab: (
    tab: 'home' | 'chat' | 'memories' | 'settings'
  ) => void;
  onEnterChat: (entry: ChatEntrySource) => Promise<void>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToTab,
  onEnterChat,
}) => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { messages } = useChat();

  const displayName =
    preferences.preferredName || user?.displayName || 'sunshine';

  const handleTalkToSunny = () => {
    void onEnterChat({ source: 'normal' });
  };

  const handleSelectIntent = async (intent: StarterIntent) => {
    await onEnterChat({
      source: 'vibe',
      selectedVibe: intent,
    });
  };

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : undefined;

  return (
    <div className="sunny-home-screen relative isolate w-full max-w-none flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 pb-8 sm:px-6 sm:py-5 sm:pb-10 lg:px-10 xl:px-14">
      <style>{`
        .sunny-home-screen {
          --sunny-home-accent: #B99AFF;
          --sunny-home-accent-bright: #D7C2FF;\n          --sunny-home-sunshine: #E879F9;
          background:
            radial-gradient(ellipse at 50% -8%, rgba(126,83,190,.30), transparent 48%),
            radial-gradient(ellipse at 100% 38%, rgba(91,54,151,.13), transparent 34%),
            linear-gradient(155deg,#12051F 0%,#1A0A2E 52%,#12051F 100%) !important;
        }
        .sunny-home-screen .sunny-home-content { width: 100%; max-width: none; margin: 0; }
        .sunny-home-screen .sunny-home-hero {
          background:
            radial-gradient(ellipse at 82% 18%,rgba(169,131,255,.27),transparent 40%),
            linear-gradient(125deg,#39245F 0%,#24183C 56%,#17102A 100%) !important;
          border: 1px solid rgba(190,160,255,.24) !important;
          box-shadow: 0 24px 64px rgba(7,3,18,.34), inset 0 1px 0 rgba(255,255,255,.09) !important;
        }
        .sunny-home-screen .sunny-hero-glow { background: rgba(167,139,250,.24) !important; }
        .sunny-home-screen .sunny-purple-cta,
        .sunny-home-screen .sunny-purple-cta button {
          background: linear-gradient(115deg,#D946EF,#8B2BE2) !important;
          color: #fff !important;
          border-color: rgba(221,205,255,.36) !important;
          box-shadow: 0 9px 28px rgba(139,43,226,.32) !important;
        }
        .sunny-home-screen .sunny-purple-cta svg { color:#fff !important; }
        .sunny-home-screen .sunny-vibe-card {
          background: linear-gradient(145deg,rgba(49,34,76,.96),rgba(27,19,44,.98)) !important;
          border-color: rgba(167,139,250,.24) !important;
        }
        .sunny-home-screen .sunny-vibe-card:hover {
          border-color: rgba(196,181,253,.65) !important;
          box-shadow: 0 14px 34px rgba(91,54,151,.2) !important;
        }
        .sunny-home-screen .sunny-daily-card,
        .sunny-home-screen .sunny-recent-card {
          background: linear-gradient(120deg,rgba(48,33,73,.88),rgba(28,20,45,.92)) !important;
          border: 1px solid rgba(167,139,250,.2) !important;
          border-radius: 22px !important;
          box-shadow: 0 12px 30px rgba(5,2,14,.16) !important;
        }
        .sunny-home-screen .sunny-home-section h2,
        .sunny-home-screen .sunny-home-section h3 { color:#F8F5FF; }
        .sunny-home-screen button:focus-visible,
        .sunny-home-screen [role="button"]:focus-visible {
          outline:2px solid #C4B5FD;
          outline-offset:3px;
        }
        :root[data-theme='sunny-light'] .sunny-home-screen {
          background:linear-gradient(155deg,#F8F6FC,#F0EAF8 58%,#F8F5FC) !important;
        }
        :root[data-theme='sunny-light'] .sunny-home-screen .sunny-home-hero {
          background:linear-gradient(125deg,#F0E8FF,#E6D9FA 58%,#F5EFFC) !important;
        }
        :root[data-theme='sunny-light'] .sunny-home-screen .sunny-home-section h2,
        :root[data-theme='sunny-light'] .sunny-home-screen .sunny-home-section h3 { color:#281B3E; }
      `}</style>
      <div className="sunny-home-content">
        <header className="mb-5 flex items-center justify-between py-2 sm:mb-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#B99AFF]/25 bg-gradient-to-br from-[#55358A] to-[#281A43] shadow-[0_8px_22px_rgba(91,54,151,.24)]">
              <SunnyLogo size="small" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">Sunny</h1>
                <span className="rounded-full border border-[#E879F9]/35 bg-[#E879F9]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.16em] text-[#FFE29A]">AI companion</span>
              </div>
              <p className="text-xs text-[#BFB0D8]">Your little corner of sunshine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[11px] font-medium text-[#C8B7E7] sm:inline-flex">
              <Sparkles size={13} className="sunny-shine" /> Here for you
            </span>
            <button
              type="button"
              onClick={() => onNavigateToTab('settings')}
              className="cursor-pointer rounded-xl border border-[#A78BFA]/20 bg-[#25103F]/80 p-2.5 text-[#D7C2FF] transition-colors hover:border-[#B99AFF]/55 hover:bg-[#381A60] hover:text-white"
              aria-label="Open settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        <GreetingCard
          displayName={displayName}
          onTalkPress={handleTalkToSunny}
        />

        <section className="sunny-home-quick-grid my-6 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Quick actions">
          <button
            type="button"
            onClick={handleTalkToSunny}
            className="group relative flex min-h-[104px] items-center gap-4 overflow-hidden rounded-[24px] border border-[#B99AFF]/25 bg-gradient-to-br from-[#3B2860] to-[#25103F] p-4 text-left shadow-[0_12px_30px_rgba(5,2,14,.16)] transition-all hover:-translate-y-1 hover:border-[#E879F9]/50 hover:shadow-[0_16px_36px_rgba(5,2,14,.24)] active:scale-[.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E879F9] text-[#25103F] shadow-[0_6px_20px_rgba(232,121,249,.18)]"><MessageCircle size={22}/></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">Start a new chat</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#CDBEE4]">A fresh conversation with Sunny</span>
            </span>
            <ArrowUpRight size={17} className="shrink-0 text-[#E879F9] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"/>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab('memories')}
            className="group relative flex min-h-[104px] items-center gap-4 overflow-hidden rounded-[24px] border border-[#B99AFF]/25 bg-gradient-to-br from-[#25103F] to-[#1A0A2E] p-4 text-left shadow-[0_12px_30px_rgba(5,2,14,.16)] transition-all hover:-translate-y-1 hover:border-[#E879F9]/50 hover:shadow-[0_16px_36px_rgba(5,2,14,.24)] active:scale-[.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E879F9]/20 bg-[#E879F9]/10 text-[#E879F9]"><Bookmark size={21}/></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">Memory vault</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#CDBEE4]">Your moments, saved with care</span>
            </span>
            <ArrowUpRight size={17} className="shrink-0 text-[#E879F9] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"/>
          </button>
        </section>

        <ConversationStarter onSelectIntent={handleSelectIntent} />

        <RecentConversations
          lastMessage={lastMessage}
          onResume={handleTalkToSunny}
        />
      </div>
    </div>
  );
};
