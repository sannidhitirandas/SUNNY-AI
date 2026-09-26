import React, { useState } from 'react';
import { ChatMessage } from '@/types/chat';
import { SunnyLogo } from '../brand/SunnyLogo';
import { Clock, CheckCheck, AlertCircle, RotateCcw, BookmarkPlus, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (id: string) => void;
  onSaveAsMemory?: (content: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  onSaveAsMemory,
}) => {
  const isUser = message.role === 'user';
  const [saved, setSaved] = useState(false);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleSaveMemory = () => {
    if (onSaveAsMemory && !saved) {
      onSaveAsMemory(message.content);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-2 px-3 sm:px-4">
        <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-xs ${
          message.deliveryStatus === 'failed'
            ? 'bg-[#302149] border border-[#FF8D9A]/50 text-white'
            : 'bg-[#FFD84D] text-[#100B22] shadow-[0_2px_8px_rgba(255,216,77,0.2)]'
        }`}>
          <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] font-medium ${
            message.deliveryStatus === 'failed' ? 'text-[#FF8D9A]' : 'text-[#100B22]/70'
          }`}>
            <span>{formatTime(message.createdAt)}</span>
            {message.deliveryStatus === 'sending' && (
              <Clock size={12} className="opacity-75 animate-pulse" />
            )}
            {message.deliveryStatus === 'sent' && (
              <CheckCheck size={13} className="opacity-80" />
            )}
            {message.deliveryStatus === 'failed' && (
              <span className="flex items-center gap-1 font-bold">
                <AlertCircle size={12} />
                <span>Not delivered</span>
              </span>
            )}
          </div>
        </div>

        {/* Failed state action banner */}
        {message.deliveryStatus === 'failed' && (
          <div className="flex items-center gap-2 mt-1.5 px-1 text-xs">
            <span className="text-[#FF8D9A] text-[11px]">
              {message.errorMessage || 'Connection failed'}
            </span>
            <button
              type="button"
              onClick={() => onRetry && onRetry(message.id)}
              className="flex items-center gap-1 bg-[#FFD84D] hover:bg-[#F6BD45] text-[#100B22] font-bold px-2 py-0.5 rounded-md text-[11px] shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw size={10} />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Sunny AI Message Bubble
  return (
    <div className="group flex items-end gap-2.5 my-2 px-3 sm:px-4 max-w-[92%] sm:max-w-[85%]">
      <div className="shrink-0 mb-1">
        <SunnyLogo size="small" />
      </div>
      <div className="bg-[#21163A] border border-[#392858] text-white px-4 py-2.5 rounded-2xl rounded-bl-xs relative">
        <p className="text-sm text-white/95 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>

        <div className="flex items-center justify-between gap-3 mt-1.5 text-[10px] text-[#9B8AB9]">
          <div className="flex items-center gap-1.5">
            <span>{formatTime(message.createdAt)}</span>
            <span className="text-[#392858]">•</span>
            <span className="text-[#FFD84D]/90 font-semibold">Gemini 3.8 Flash</span>
          </div>

          {onSaveAsMemory && (
            <button
              type="button"
              onClick={handleSaveMemory}
              className={`opacity-80 hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                saved
                  ? 'text-[#A8D9A0] bg-[#A8D9A0]/10'
                  : 'text-[#C6B8E5] hover:text-[#FFD84D] hover:bg-[#302149]'
              }`}
              title="Save a takeaway from this message into your memory vault"
            >
              {saved ? (
                <>
                  <Check size={11} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={11} />
                  <span>Remember</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
