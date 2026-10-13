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
    .replace(/`[\s\S]*?`/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\(([^\)]*)]\([^)]*\)/g, '$1')
    .replace(/\(([^\)]+)]\([^)]*\)/g, '$1')
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
      <h3 className="mb-3 text-lg font-medium tracking-tight text-white">
        Recent conversation
      </h3>

      {lastMessage ? (
        <AppCard
          onPress={onResume}
          className="rounded-2xl border border-[#392858]/70 bg-[#17102C] p-3.5 transition-colors hover:border-[#FFD84D]/40 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#302149]">
              <MessageSquareText size={18} className="text-[#FFD84D]" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-[#9B8AB9]">
                {lastMessage.role === 'user' ? 'You said:' : 'Sunny said:'}
              </span>
              <p className="max-w-full truncate text-xs font-normal text-white sm:text-sm">
                {toPreviewText(lastMessage.content)}
              </p>
            </div>

            <ArrowRight size={16} className="shrink-0 text-[#FFD84D]" />
          </div>
        </AppCard>
      ) : (
        <AppCard className="p-4 text-center">
          <p className="text-xs text-[#9B8AB9]">
            No past conversations yet. Tap "Talk to Sunny" above to get
            started!
          </p>
        </AppCard>
      )}
    </div>
  );
};
