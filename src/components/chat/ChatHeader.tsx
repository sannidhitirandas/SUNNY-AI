import React from 'react';
import { ArrowLeft, MoreVertical, Sparkles } from 'lucide-react';
import { SunnyLogo } from '../brand/SunnyLogo';
import { Badge } from '../ui/Badge';

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
    <div className="flex items-center justify-between px-4 py-3 bg-[#17102C] border-b border-[#392858]">
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
        <SunnyLogo size="small" />
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            Sunny <span className="text-xs">☀️</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A8D9A0] inline-block animate-pulse" />
            <span className="text-[11px] text-[#C6B8E5] font-medium flex items-center gap-1">
              <Sparkles size={11} className="text-[#FFD84D]" />
              <span>Gemini 3.8 Flash • {preferredTone}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge label="AI Active" variant="green" />
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
