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
          className="sunny-recent-card rounded-[22px] border border-[#5A426F]/45 bg-gradient-to-r from-[#211633] to-[#191229] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] transition-all hover:-translate-y-0.5 hover:border-[#FFD84D]/35 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#302149] flex items-center justify-center shrink-0">
              <MessageSquareText size={18} className="text-[#FFD84D]" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs text-white/85 block font-medium">
                {lastMessage.role === 'user' ? 'You said:' : 'Sunny said:'}
              </span>
              <p className="text-xs sm:text-sm text-white truncate font-normal max-w-full">
                {toPreviewText(lastMessage.content)}
              </p>
            </div>

            <ArrowRight
              size={16}
              className="text-[#FFD84D] shrink-0"
            />
          </div>
        </AppCard>
      ) : (
        <AppCard className="p-4 text-center">
          <p className="text-xs text-white/85">
            No past conversations yet. Tap "Talk to Sunny" above to get started!
          </p>
        </AppCard>
      )}
    </section>
  );
};
