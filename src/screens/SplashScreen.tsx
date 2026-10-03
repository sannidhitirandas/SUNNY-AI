import React, { useEffect } from 'react';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { audioService } from '@/services/audioService';

interface SplashScreenProps {
  onReady: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  useEffect(() => {
    void audioService.play('open');
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const timer = window.setTimeout(onReady, prefersReducedMotion ? 250 : 3000);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <div
      className="sunny-intro fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#100B22] p-6 text-center select-none"
      role="status"
      aria-live="polite"
    >
      <div className="sunny-intro-pop mb-6">
        <div className="sunny-intro-spin">
          <SunnyLogo size="huge" />
        </div>
      </div>

      <div className="sunny-intro-greeting">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Hey, Sunshine! 💛
        </h1>
        <p className="text-sm text-[#C6B8E5]">
          Your little corner of sunshine.
        </p>
      </div>
    </div>
  );
};
