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
  {
    intent: 'listen',
    title: 'I need someone to listen',
    description: "Let's talk about what's on your mind.",
    icon: <Heart size={20} className="text-[#FF8D9A]" />,
    iconBg: 'bg-[#FF8D9A]/15',
  },
  {
    intent: 'laugh',
    title: 'Distract me and make me laugh',
    description: "Let's find something fun to talk about.",
    icon: <Smile size={20} className="text-[#FFD84D]" />,
    iconBg: 'bg-[#FFD84D]/15',
  },
  {
    intent: 'encourage',
    title: 'I need a little encouragement',
    description: "Let's take things one step at a time.",
    icon: <Sun size={20} className="text-[#F6BD45]" />,
    iconBg: 'bg-[#F6BD45]/15',
  },
  {
    intent: 'anything',
    title: "Let's talk about anything",
    description: 'Random thoughts, everyday stories, anything goes.',
    icon: <MessageCircle size={20} className="text-[#A8D9A0]" />,
    iconBg: 'bg-[#A8D9A0]/15',
  },
];

export const ConversationStarter: React.FC<ConversationStarterProps> = ({ onSelectIntent }) => {
  return (
    <section className="sunny-home-section my-7 sm:my-9" aria-labelledby="sunny-starter-heading">
      <div className="mb-4 flex items-end justify-between gap-3"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFD84D]/80">A moment for you</p><h2 id="sunny-starter-heading" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
        What would feel good right now?
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
        {STARTER_OPTIONS.map((item) => (
          <AppCard
            key={item.intent}
            onPress={() => onSelectIntent(item.intent)}
            className="sunny-vibe-card group min-h-[94px] rounded-[22px] border border-[#5A426F]/55 bg-gradient-to-br from-[#261B3B] to-[#1A132B] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] transition-all duration-200 hover:-translate-y-1 hover:border-[#FFD84D]/45 hover:shadow-[0_12px_28px_rgba(0,0,0,.22)] active:scale-[.98] sm:min-h-[116px] sm:p-4
          >
            <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
              <div className={`sunny-vibe-icon w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 sm:w-11 sm:h-11 ${item.iconBg}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold leading-snug text-white line-clamp-2 sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-1 hidden text-[13px] leading-relaxed text-[#B9AACA] sm:block">
                  {item.description}
                </p>
              </div>
            </div>
            <ArrowUpRight size={16} className="ml-auto hidden shrink-0 text-white/80 transition-colors group-hover:text-[#FFD84D] sm:block" />
          </AppCard>
        ))}
      </div>
    </div>
  );
};
