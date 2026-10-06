import { ChatMessage } from '@/types/chat';
import { BookmarkPlus, Check, FileText, CheckCheck } from 'lucide-react';
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
  onRetry,
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
      <div className="flex flex-col items-end my-2 px-3 sm:px-4">
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-xs bg-[#FFD84D] text-[#100B22] shadow-[0_2px_8px_rgba(255,216,77,0.2)]">
          {message.attachments?.length ? (
            <div className="mb-2 space-y-1.5">
              {message.attachments.map((file) => (
                <div key={file.id} className="flex items-center gap-2 rounded-lg bg-[#100B22]/10 px-2 py-1.5">
                  <FileText size={14} />
                  <span className="text-xs font-semibold truncate">{file.name}</span>
                  <span className="text-[10px] opacity-70 shrink-0">{formatSize(file.size)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {message.content && <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{message.content}</p>}
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] font-medium text-[#100B22]/70">
            <span>{formatTime(message.createdAt)}</span>
            <Check size={13} className="opacity-80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-end gap-2.5 my-2 px-3 sm:px-4 max-w-[92%] sm:max-w-[85%]">
      <div className="shrink-0 mb-1"><SunnyLogo size="small" /></div>
      <div className="bg-[#21163A] border border-[#392858] text-white px-4 py-2.5 rounded-2xl rounded-bl-xs relative">
        <p className="text-sm text-white/95 whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <div className="flex items-center justify-between gap-3 mt-1.5 text-[10px] text-[#9B8AB9]">
          <div className="flex items-center gap-1.5"><span>{formatTime(message.createdAt)}</span><span className="text-[#392858]">•</span></div>
          {onSaveAsMemory && (
            <button type="button" onClick={handleSaveMemory} className={`opacity-80 hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${saved ? 'text-[#A8D9A0] bg-[#A8D9A0]/10' : 'text-[#C6B8E5] hover:text-[#FFD84D] hover:bg-[#302149]'}`} title="Save a takeaway from this message into your memory vault">
              {saved ? <><Check size={11} /><span>Saved</span></> : <><BookmarkPlus size={11} /><span>Remember</span></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
