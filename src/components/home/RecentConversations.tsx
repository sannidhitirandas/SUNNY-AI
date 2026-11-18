import React from 'react';
import { ChatMessage } from '@/types/chat';
import { AppCard } from '../ui/AppCard';
import { MessageSquareText, ArrowRight } from 'lucide-react';

interface RecentConversationsProps {
  lastMessage?: ChatMessage;
  onResume: () => void;
}

const toPreviewText = (content: string): string => {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const RecentConversations: React.FC<RecentConversationsProps> = ({
  lastMessage,
  onResume,
}) => {
  return (
    <section className="sunny-home-section my-7 sm:my-9" aria-labelledby="sunny-recent-heading">
      <h3 id="sunny-recent-heading" className="mb-3 text-lg font-semibold tracking-tight text-white">
        Recent conversation
      </h3>
      {lastMessage ? (
        <AppCard
          onPress={onResume}
          className="sunny-recent-card rounded-[22px] border border-[#8B6AC0]/25 bg-gradient-to-r from-[#241936] to-[#191229] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] transition-all hover:-translate-y-0.5 hover:border-[#B99AFF]/50 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/20">
              <MessageSquareText size={18} className="text-[#C4A8FF]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-[#D7C8EF]">
                {lastMessage.role === 'user' ? 'You said:' : 'Sunny said:'}
              </span>
              <p className="max-w-full truncate text-xs font-normal text-white sm:text-sm">
                {toPreviewText(lastMessage.content)}
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-[#B99AFF]" />
          </div>
        </AppCard>
      ) : (
        <AppCard className="border border-[#8B6AC0]/20 bg-[#211832]/80 p-4 text-center">
          <p className="text-xs text-[#D7C8EF]">
            No past conversations yet. Tap "Talk to Sunny" above to get started!
          </p>
        </AppCard>
      )}
    </section>
  );
};
