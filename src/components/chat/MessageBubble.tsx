import { ChatMessage } from '@/types/chat';
import { BookmarkPlus, Check, Copy, FileText, MoreHorizontal } from 'lucide-react';
import React, { useRef, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setMenuOpen(true);
    }, 500);
  };

  const handleSaveMemory = () => {
    if (onSaveAsMemory && !saved) {
      onSaveAsMemory(message.content);
      setSaved(true);
      setMenuOpen(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setMenuOpen(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access may be unavailable in some browser or app contexts.
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
      <div
        className="relative max-w-[88%] rounded-[22px] rounded-bl-md border border-[#604477]/55 bg-gradient-to-br from-[#261a3d] to-[#21163A] px-4 py-3 text-white shadow-[0_5px_20px_rgba(0,0,0,0.10)] sm:max-w-[78%] sm:px-5"
        onTouchStart={handleTouchStart}
        onTouchEnd={clearLongPress}
        onTouchMove={clearLongPress}
        onContextMenu={(event) => {
          event.preventDefault();
          clearLongPress();
          setMenuOpen(true);
        }}
      >
        <p className="whitespace-pre-wrap text-sm leading-6 text-white/95">{message.content}</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#B6A6CC]">
          <span>{formatTime(message.createdAt)}</span>
          <div className="flex items-center gap-1.5">
            {copied && <span className="text-[#A8D9A0]">Copied</span>}
            {saved && <span className="text-[#A8D9A0]">Saved to memory</span>}
            <button
              type="button"
              aria-label="Open message options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#C6B8E5] transition-colors hover:bg-[#302149] hover:text-[#FFD84D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84D]/70 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              title="Message options"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close message options"
              className="fixed inset-0 z-20 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute bottom-10 right-2 z-30 min-w-48 rounded-xl border border-[#604477] bg-[#17102C] p-1.5 shadow-xl shadow-black/30">
              {onSaveAsMemory && (
                <button
                  type="button"
                  onClick={handleSaveMemory}
                  disabled={saved}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-[#302149] hover:text-[#FFD84D] disabled:text-[#A8D9A0]"
                >
                  {saved ? <Check size={15} /> : <BookmarkPlus size={15} />}
                  <span>{saved ? 'Saved to memory' : 'Remember this'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-[#302149] hover:text-[#FFD84D]"
              >
                <Copy size={15} />
                <span>Copy message</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
