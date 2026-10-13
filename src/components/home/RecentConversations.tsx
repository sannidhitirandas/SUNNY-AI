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
    <div className="my-6 sm:my-8">
      <h3 className="text-lg font-medium tracking-tight text-white mb-3">
        Recent conversation
      </h3>
      {lastMessage ? (
        <AppCard
          onPress={onResume}
          className="rounded-2xl border border-[#392858]/70 bg-[#17102C] p-3.5 transition-colors hover:border-[#FFD84D]/40 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#302149] flex items-center justify-center shrink-0">
              <MessageSquareText size={18} className="text-[#FFD84D]" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs text-[#9B8AB9] block font-medium">
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
          <p className="text-xs text-[#9B8AB9]">
            No past conversations yet. Tap "Talk to Sunny" above to get started!
          </p>
        </AppCard>
      )}
    </div>
  );
};
