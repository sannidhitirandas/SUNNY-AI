import React from 'react';
import { StarterIntent } from '@/types/chat';
import { AppCard } from '../ui/AppCard';
import { Heart, Smile, Sun, MessageCircle, ChevronRight } from 'lucide-react';

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
    <div className="my-5">
      <h2 className="text-base font-bold text-white mb-3">
        What's the vibe today?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {STARTER_OPTIONS.map((item) => (
          <AppCard
            key={item.intent}
            onPress={() => onSelectIntent(item.intent)}
            className="p-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-[#C6B8E5] truncate">
                  {item.description}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#9B8AB9] shrink-0 ml-2" />
          </AppCard>
        ))}
      </div>
    </div>
  );
};
