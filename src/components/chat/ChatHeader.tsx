import { ArrowLeft, MoreVertical, Sparkles, Sun } from 'lucide-react';
import React from 'react';
import { SunnyLogo } from '../brand/SunnyLogo';


interface ChatHeaderProps {
  onBack?: () => void;
  onOptionsPress: () => void;
  preferredTone?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBack,
  onOptionsPress,
  preferredTone = 'Adaptive',
}) => {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#392858]/80 bg-[#17102C]/95 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4 lg:rounded-t-3xl lg:border-x">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-white/5 text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#FFD84D]/20 bg-[#FFD84D]/10 text-[#FFD84D]"><Sun size={21} /></div>
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-white sm:text-base">
            Sunny <span className="text-xs">☀️</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A8D9A0] inline-block animate-pulse" />
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#C6B8E5] sm:text-xs">
              <Sparkles size={11} className="text-[#FFD84D]" />
              <span>{preferredTone} • Here for you</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-[#A8D9A0]/20 bg-[#A8D9A0]/10 px-2.5 py-1 text-[10px] font-medium text-[#A8D9A0] sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-[#A8D9A0]" /> Here for you</span>
        <button
          type="button"
          onClick={onOptionsPress}
          className="p-1.5 rounded-lg hover:bg-[#302149] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
          aria-label="Chat options"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};
