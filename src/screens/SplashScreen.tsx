import React, { useEffect } from 'react';
import { SunnyLogo } from '@/components/brand/SunnyLogo';

interface SplashScreenProps {
  onReady: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onReady();
    }, 1400);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#100B22] p-6 text-center select-none animate-in fade-in duration-300">
      <div className="relative mb-6">
        <SunnyLogo size="huge" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
        Sunny <span className="text-xl">☀️</span>
      </h1>
      <p className="text-sm text-[#C6B8E5] mb-6">
        Your little corner of sunshine
      </p>

      <div className="max-w-xs p-3.5 rounded-2xl bg-[#21163A]/80 border border-[#FFD84D]/25 backdrop-blur-xs">
        <p className="text-xs italic text-[#FFD84D] font-medium leading-relaxed">
          "You don't have to start over every time you come back."
        </p>
      </div>

      <div className="mt-8 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#FFD84D] typing-dot-1" />
        <span className="w-2 h-2 rounded-full bg-[#FFD84D] typing-dot-2" />
        <span className="w-2 h-2 rounded-full bg-[#FFD84D] typing-dot-3" />
      </div>
    </div>
  );
};
