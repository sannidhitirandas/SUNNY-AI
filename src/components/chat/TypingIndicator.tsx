import React from 'react';
import { SunnyLogo } from '../brand/SunnyLogo';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full items-end gap-2.5 px-4 pb-0.5 pt-3 sm:px-6 lg:px-10">
      <div className="mb-1 shrink-0">
        <SunnyLogo size="small" />
      </div>
      <div className="sunny-bot-bubble flex items-center gap-1.5 rounded-[22px] rounded-bl-md border border-[#7656A5]/55 bg-gradient-to-br from-[#2D1450] to-[#25103F] px-4 py-2.5 text-white shadow-[0_5px_20px_rgba(0,0,0,0.10)] sm:px-5">
        <span className="h-2 w-2 rounded-full bg-[#B99AFF] typing-dot-1" />
        <span className="h-2 w-2 rounded-full bg-[#B99AFF] typing-dot-2" />
        <span className="h-2 w-2 rounded-full bg-[#B99AFF] typing-dot-3" />
        <span className="ml-2 text-xs font-medium text-[#D6C2F2]">Sunny is thinking...</span>
      </div>
    </div>
  );
};
