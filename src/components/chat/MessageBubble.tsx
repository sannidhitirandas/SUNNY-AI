import { ChatMessage } from '@/types/chat';
import { BookmarkPlus, Check, FileText } from 'lucide-react';
import React, { useState } from 'react';
import { SunnyLogo } from '../brand/SunnyLogo';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (id: string) => void;
  onSaveAsMemory?: (content: string) => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSaveAsMemory,
}) => {
  const isUser = message.role === 'user';
  const [saved, setSaved] = useState(false);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <div className="mx-auto flex w-full max-w-3xl flex-col items-end px-4 py-1.5 sm:px-6">
        <div className="max-w-[88%] rounded-[22px] rounded-br-md border border-[#FFD84D]/20 bg-[#FFD84D] px-4 py-3 text-[#100B22] shadow-[0_5px_18px_rgba(255,216,77,0.10)] sm:max-w-[76%] sm:px-5">
          {message.attachments?.length ? (
            <div className="mb-2 space-y-1.5">
              {message.attachments.map((file) => (
                <div key={file.id} className="flex items-center gap-2 rounded-lg bg-[#100B22]/10 px-2 py-1.5">
                  <FileText size={14} />
                  <span className="truncate text-xs font-semibold">{file.name}</span>
                  <span className="shrink-0 text-[10px] opacity-70">{formatSize(file.size)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {message.content && <p className="whitespace-pre-wrap text-sm font-medium leading-6">{message.content}</p>}
          <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-medium text-[#100B22]/65">
            <span>{formatTime(message.createdAt)}</span>
            <Check size={13} className="opacity-80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group mx-auto flex w-full max-w-3xl items-end gap-3 px-4 py-1.5 sm:px-6">
      <div className="mb-1 shrink-0"><SunnyLogo size="small" /></div>
      <div className="relative max-w-[88%] rounded-[22px] rounded-bl-md border border-[#604477]/55 bg-gradient-to-br from-[#261a3d] to-[#21163A] px-4 py-3 text-white shadow-[0_5px_20px_rgba(0,0,0,0.10)] sm:max-w-[78%] sm:px-5">
        <p className="whitespace-pre-wrap text-sm leading-6 text-white/95">{message.content}</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#B6A6CC]">
          <span>{formatTime(message.createdAt)}</span>
          {onSaveAsMemory && (
            <button
              type="button"
              onClick={handleSaveMemory}
              className={`flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 transition-colors ${saved ? 'bg-[#A8D9A0]/10 text-[#A8D9A0]' : 'text-[#C6B8E5] hover:bg-[#302149] hover:text-[#FFD84D]'}`}
              title="Save a takeaway from this message into your memory vault"
            >
              {saved ? <><Check size={11} /><span>Saved</span></> : <><BookmarkPlus size={11} /><span>Remember</span></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
