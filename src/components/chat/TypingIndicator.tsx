import React from 'react';
import { SunnyLogo } from '../brand/SunnyLogo';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-4xl items-end gap-2.5 px-4 pb-0.5 pt-3 sm:px-6">
      <div className="mb-1 shrink-0">
        <SunnyLogo size="small" />
      </div>
      <div className="sunny-bot-bubble flex items-center gap-1.5 rounded-[22px] rounded-bl-md border border-[#604477]/55 bg-gradient-to-br from-[#261a3d] to-[#21163A] px-4 py-2.5 text-white shadow-[0_5px_20px_rgba(0,0,0,0.10)] sm:px-5">
        <span className="h-2 w-2 rounded-full bg-[#FFD84D] typing-dot-1" />
        <span className="h-2 w-2 rounded-full bg-[#FFD84D] typing-dot-2" />
        <span className="h-2 w-2 rounded-full bg-[#FFD84D] typing-dot-3" />
        <span className="ml-2 text-xs font-medium text-[#C6B8E5]">Sunny is thinking...</span>
      </div>
    </div>
  );
};
