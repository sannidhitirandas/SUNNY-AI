import React from 'react';
import { ArrowLeft, Mic, MoreVertical, Sparkles, Sun } from 'lucide-react';
import { SunnyLogo } from '../brand/SunnyLogo';

interface ChatHeaderProps {
  onBack?: () => void;
  onOptionsPress: () => void;
  onVoicePress: () => void;
  onPersonalityPress: () => void;
  preferredTone?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBack,
  onOptionsPress,
  onVoicePress,
  onPersonalityPress,
  preferredTone = 'The Mix',
}) => {
  return (
    <header className="sunny-chat-header sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#4A2A73]/70 bg-gradient-to-r from-[#1E0B33]/95 via-[#211638]/92 to-[#1E0B33]/95 px-4 py-3.5 backdrop-blur-2xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-[#D6C2F2] transition-colors hover:bg-white/5 hover:text-white" aria-label="Go back">
            <ArrowLeft size={19} />
          </button>
        )}
        <div className="sunny-chat-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-[17px] border border-[#E879F9]/35 bg-gradient-to-br from-[#E879F9]/20 to-[#8B5CF6]/25 text-[#E879F9] shadow-[0_5px_22px_rgba(185,154,255,.08)]">
          <Sun size={21} />
        </div>
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-white">
            Sunny <span className="text-xs">☀️</span>
          </h2>
          <button type="button" onClick={onPersonalityPress} className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#B99AFF]/20 bg-[#B99AFF]/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#DCC18A] transition-all hover:border-[#E879F9]/40 hover:bg-[#E879F9]/[0.10] active:scale-[.97]" aria-label={`Change Sunny's personality. Current: ${preferredTone}`}>
            <Sparkles size={11} className="shrink-0" />
            <span className="truncate">{preferredTone}</span>
            <span className="text-[#D6C2F2]/80">· Change</span>
          </button>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-[#B9A6E8]/15 bg-[#B9A6E8]/[0.07] px-3 py-1.5 text-[10px] font-semibold text-[#B9A6E8] sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B9A6E8] shadow-[0_0_8px_rgba(168,217,160,.65)]" /> ONLINE · HERE FOR YOU
        </span>
        <button type="button" onClick={onVoicePress} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B99AFF]/25 bg-[#B99AFF]/[0.09] text-[#CDB8FF] transition-all hover:border-[#B99AFF]/50 hover:bg-[#B99AFF]/[0.16] hover:text-white active:scale-95" aria-label="Start voice conversation" title="Voice conversation">
          <Mic size={17} />
        </button>
        <button type="button" onClick={onOptionsPress} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.035] text-[#D6C2F2] transition-all hover:border-white/10 hover:bg-white/[0.08] hover:text-white active:scale-95" aria-label="Chat options">
          <MoreVertical size={18} />
        </button>
      </div>
    </header>
  );
};
