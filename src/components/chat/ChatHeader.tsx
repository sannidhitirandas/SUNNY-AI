import React from 'react';
import { ArrowLeft, MoreVertical, Sparkles, Sun } from 'lucide-react';
import { SunnyLogo } from '../brand/SunnyLogo';

interface ChatHeaderProps {
  onBack?: () => void;
  onOptionsPress: () => void;
  onPersonalityPress: () => void;
  preferredTone?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBack,
  onOptionsPress,
  onPersonalityPress,
  preferredTone = 'The Mix',
}) => {
  return (
    <header className="sunny-chat-header sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#392858]/70 bg-[#17102C]/88 px-4 py-3 backdrop-blur-2xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-[#C6B8E5] transition-colors hover:bg-white/5 hover:text-white" aria-label="Go back">
            <ArrowLeft size={19} />
          </button>
        )}
        <div className="sunny-chat-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#FFD84D]/25 bg-gradient-to-br from-[#FFD84D]/20 to-[#8B65C9]/20 text-[#FFD84D] shadow-[0_5px_22px_rgba(255,216,77,.08)]">
          <Sun size={21} />
        </div>
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-white">
            Sunny <span className="text-xs">☀️</span>
          </h2>
          <button type="button" onClick={onPersonalityPress} className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#FFD84D]/20 bg-[#FFD84D]/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#FFD84D] transition-all hover:border-[#FFD84D]/40 hover:bg-[#FFD84D]/[0.12] active:scale-[.97]" aria-label={`Change Sunny's personality. Current: ${preferredTone}`}>
            <Sparkles size={11} className="shrink-0" />
            <span className="truncate">{preferredTone}</span>
            <span className="text-[#C6B8E5]/80">· Change</span>
          </button>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-[#A8D9A0]/15 bg-[#A8D9A0]/[0.07] px-3 py-1.5 text-[10px] font-semibold text-[#A8D9A0] sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A8D9A0] shadow-[0_0_8px_rgba(168,217,160,.65)]" /> Here for you
        </span>
        <button type="button" onClick={onOptionsPress} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.035] text-[#C6B8E5] transition-all hover:border-white/10 hover:bg-white/[0.08] hover:text-white active:scale-95" aria-label="Chat options">
          <MoreVertical size={18} />
        </button>
      </div>
    </header>
  );
};
