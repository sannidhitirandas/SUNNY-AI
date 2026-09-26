import React from 'react';
import { ChatMessage } from '@/types/chat';
import { AppCard } from '../ui/AppCard';
import { MessageSquareText, ArrowRight } from 'lucide-react';

interface RecentConversationsProps {
  lastMessage?: ChatMessage;
  onResume: () => void;
}

export const RecentConversations: React.FC<RecentConversationsProps> = ({
  lastMessage,
  onResume,
}) => {
  return (
    <div className="my-5">
      <h3 className="text-sm font-semibold text-white mb-2.5">
        Recent conversation
      </h3>
      {lastMessage ? (
        <AppCard onPress={onResume} className="p-3.5 hover:border-[#FFD84D]/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FFD84D]/15 flex items-center justify-center shrink-0">
              <MessageSquareText size={18} className="text-[#FFD84D]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-[#9B8AB9] block font-medium">
                {lastMessage.role === 'user' ? 'You said:' : 'Sunny said:'}
              </span>
              <p className="text-xs sm:text-sm text-white truncate font-normal">
                {lastMessage.content}
              </p>
            </div>
            <ArrowRight size={16} className="text-[#FFD84D] shrink-0" />
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
