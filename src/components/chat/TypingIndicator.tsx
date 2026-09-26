import React from 'react';
import { SunnyLogo } from '../brand/SunnyLogo';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end gap-2.5 my-2 px-3 sm:px-4">
      <div className="shrink-0 mb-1">
        <SunnyLogo size="small" />
      </div>
      <div className="flex items-center gap-1.5 bg-[#21163A] border border-[#392858] px-4 py-3 rounded-2xl rounded-bl-xs">
        <span className="w-2 h-2 rounded-full bg-[#FFD84D] typing-dot-1" />
        <span className="w-2 h-2 rounded-full bg-[#FFD84D] typing-dot-2" />
        <span className="w-2 h-2 rounded-full bg-[#FFD84D] typing-dot-3" />
        <span className="text-xs text-[#C6B8E5] ml-2 font-medium">Sunny is thinking...</span>
      </div>
    </div>
  );
};
