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
    <div className="my-6 sm:my-8">
      <h2 className="text-xl font-medium tracking-tight text-white mb-3 sm:text-2xl">
        What would feel good right now?
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
        {STARTER_OPTIONS.map((item) => (
          <AppCard
            key={item.intent}
            onPress={() => onSelectIntent(item.intent)}
            className="group min-h-[82px] rounded-2xl border border-[#4A345F]/70 bg-[#211633]/90 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFD84D]/35 hover:bg-[#2A1B40] sm:min-h-[104px] sm:p-4"
          >
            <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 sm:w-10 sm:h-10 ${item.iconBg}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2 sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-1 hidden text-sm leading-relaxed text-[#B6A6CC] sm:block">
                  {item.description}
                </p>
              </div>
            </div>
            <ArrowUpRight size={16} className="ml-auto hidden shrink-0 text-[#9B8AB9] transition-colors group-hover:text-[#FFD84D] sm:block" />
          </AppCard>
        ))}
      </div>
    </div>
  );
};
