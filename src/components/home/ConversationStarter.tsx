import React from 'react';
import { StarterIntent } from '@/types/chat';
import { AppCard } from '../ui/AppCard';
import { Heart, Smile, Sun, MessageCircle, ArrowUpRight } from 'lucide-react';

interface ConversationStarterProps {
  onSelectIntent: (intent: StarterIntent) => void;
}
interface StarterOption {
  intent: StarterIntent;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}
const STARTER_OPTIONS: StarterOption[] = [
  { intent: 'listen', title: 'I need someone to listen', description: "Let's talk about what's on your mind.", icon: <Heart size={20} className="text-[#D8B4FE]" />, iconBg: 'bg-[#A78BFA]/15' },
  { intent: 'laugh', title: 'Distract me and make me laugh', description: "Let's find something fun to talk about.", icon: <Smile size={20} className="text-[#C4B5FD]" />, iconBg: 'bg-[#8B5CF6]/15' },
  { intent: 'encourage', title: 'I need a little encouragement', description: "Let's take things one step at a time.", icon: <Sun size={20} className="text-[#E9D5FF]" />, iconBg: 'bg-[#C084FC]/15' },
  { intent: 'anything', title: "Let's talk about anything", description: 'Random thoughts, everyday stories, anything goes.', icon: <MessageCircle size={20} className="text-[#DDD6FE]" />, iconBg: 'bg-[#7C3AED]/20' },
];

export const ConversationStarter: React.FC<ConversationStarterProps> = ({ onSelectIntent }) => (
  <section className="sunny-home-section my-7 sm:my-9" aria-labelledby="sunny-starter-heading">
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B99AFF]">A moment for you</p>
        <h2 id="sunny-starter-heading" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">What would feel good right now?</h2>
      </div>
      <span className="hidden pb-1 text-xs text-[#B9AACA] sm:block">Choose your vibe</span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:gap-4">
      {STARTER_OPTIONS.map((item) => (
        <AppCard key={item.intent} onPress={() => onSelectIntent(item.intent)}
          className="sunny-vibe-card group min-h-[104px] rounded-[22px] border border-[#8B6AC0]/30 bg-gradient-to-br from-[#2B1E45] to-[#191229] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] transition-all duration-200 hover:-translate-y-1 hover:border-[#B99AFF]/65 hover:shadow-[0_12px_28px_rgba(93,55,150,.2)] active:scale-[.98] sm:min-h-[116px] sm:p-4">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <div className={`sunny-vibe-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] sm:h-11 sm:w-11 ${item.iconBg}`}>{item.icon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-white sm:text-base">{item.title}</h3>
              <p className="mt-1 hidden text-[13px] leading-relaxed text-[#C7B8DC] sm:block">{item.description}</p>
            </div>
          </div>
          <ArrowUpRight size={16} className="ml-auto hidden shrink-0 text-[#B99AFF] transition-colors group-hover:text-white sm:block" />
        </AppCard>
      ))}
    </div>
  </section>
);
