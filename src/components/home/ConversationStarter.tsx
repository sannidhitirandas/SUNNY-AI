import React from 'react';
import { StarterIntent } from '@/types/chat';
import { Heart, Smile, Sun, MessageCircle, ArrowUpRight } from 'lucide-react';

interface ConversationStarterProps {
  onSelectIntent: (intent: StarterIntent) => void;
}

const STARTER_OPTIONS: {
  intent: StarterIntent;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  { intent: 'listen', title: 'Listen to me', description: 'A safe space to let it out.', icon: <Heart size={19}/>, accent: 'from-[#A78BFA]/20 to-[#7C3AED]/5' },
  { intent: 'laugh', title: 'Make me laugh', description: 'A little lightness and fun.', icon: <Smile size={19}/>, accent: 'from-[#D946EF]/20 to-[#F59E0B]/5' },
  { intent: 'encourage', title: 'Encourage me', description: 'Find one small next step.', icon: <Sun size={19}/>, accent: 'from-[#E879F9]/20 to-[#A78BFA]/5' },
  { intent: 'anything', title: 'Surprise me', description: 'Let’s see where we go.', icon: <MessageCircle size={19}/>, accent: 'from-[#8B5CF6]/20 to-[#C4B5FD]/5' },
];

export const ConversationStarter: React.FC<ConversationStarterProps> = ({ onSelectIntent }) => (
  <section className="sunny-home-section my-7 sm:my-9" aria-labelledby="sunny-starter-heading">
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E879F9]">A little inspiration</p>
        <h2 id="sunny-starter-heading" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">What’s on your mind?</h2>
      </div>
      <span className="hidden pb-1 text-xs text-[#B9AACA] sm:block">Trending prompts</span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:gap-4">
      {STARTER_OPTIONS.map((item) => (
        <button
          key={item.intent}
          type="button"
          onClick={() => onSelectIntent(item.intent)}
          className={`sunny-vibe-card group relative flex min-h-[112px] items-center gap-3 overflow-hidden rounded-[22px] border border-[#A78BFA]/20 bg-gradient-to-br ${item.accent} p-3.5 text-left shadow-[0_8px_24px_rgba(0,0,0,.12)] transition-all duration-200 hover:-translate-y-1 hover:border-[#E879F9]/45 hover:shadow-[0_14px_30px_rgba(91,54,151,.2)] active:scale-[.98] sm:min-h-[122px] sm:p-4`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-[#1E0B33]/70 text-[#E879F9]">{item.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold leading-snug text-white sm:text-sm">{item.title}</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-[#C7B8DC] sm:text-xs">{item.description}</span>
          </span>
          <ArrowUpRight size={15} className="absolute right-3 top-3 text-[#E879F9]/75 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
        </button>
      ))}
    </div>
  </section>
);
