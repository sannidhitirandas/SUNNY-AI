import React, { useEffect } from 'react';
import { SunnySun } from '@/components/brand/SunnySun';
import { audioService } from '@/services/audioService';
import { usePreferences } from '@/context/PreferencesContext';

interface SplashScreenProps {
  onReady: () => void;
}

// Fixed positions so the sky looks the same every launch (no layout jumps).
const SPARKLES: Array<{ left: string; top: string; size: number; delay: number; duration: number }> = [
  { left: '12%', top: '16%', size: 3, delay: 0.2, duration: 3.2 },
  { left: '24%', top: '30%', size: 2, delay: 1.1, duration: 2.8 },
  { left: '8%', top: '48%', size: 2, delay: 0.7, duration: 3.6 },
  { left: '34%', top: '12%', size: 2, delay: 1.6, duration: 3.0 },
  { left: '48%', top: '8%', size: 3, delay: 0.4, duration: 3.4 },
  { left: '62%', top: '14%', size: 2, delay: 1.3, duration: 2.9 },
  { left: '76%', top: '10%', size: 3, delay: 0.9, duration: 3.3 },
  { left: '88%', top: '22%', size: 2, delay: 0.3, duration: 3.1 },
  { left: '82%', top: '40%', size: 2, delay: 1.8, duration: 3.5 },
  { left: '92%', top: '56%', size: 3, delay: 0.6, duration: 2.7 },
  { left: '16%', top: '62%', size: 2, delay: 1.4, duration: 3.2 },
  { left: '70%', top: '28%', size: 2, delay: 2.0, duration: 3.0 },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  const { preferences } = usePreferences();
  useEffect(() => {
    void audioService.play('open');
    if (preferences.audioPreferences.musicEnabled) {
      void audioService.playNonChatMusic(preferences.audioPreferences.selectedBackgroundMusic);
    }
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const timer = window.setTimeout(onReady, prefersReducedMotion ? 250 : 3000);
    return () => clearTimeout(timer);
  }, [onReady, preferences.audioPreferences.musicEnabled, preferences.audioPreferences.selectedBackgroundMusic]);

  return (
    <div
      className="sunrise-screen fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden p-6 text-center select-none"
      role="status"
      aria-live="polite"
      aria-label="Sunny is waking up"
    >
      <style>{`
        .sunrise-screen {
          isolation: isolate;
          background: radial-gradient(ellipse at 50% 38%, rgba(139,92,246,.28), transparent 44%), radial-gradient(ellipse at 50% 100%, rgba(217,70,239,.12), transparent 38%), linear-gradient(160deg,#12051F 0%,#1E0B33 54%,#12051F 100%);
        }
        .sunrise-screen > .sunrise-sun,
        .sunrise-screen > .sunrise-eyebrow,
        .sunrise-screen > .sunrise-wordmark,
        .sunrise-screen > .sunrise-greeting,
        .sunrise-screen > .sunrise-tagline,
        .sunrise-screen > .sunrise-loader {
          position: relative;
          z-index: 3;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 1), 0 3px 10px rgba(0, 0, 0, 0.98), 0 8px 28px rgba(0, 0, 0, 0.92);
        }
        .sunrise-screen > .sunrise-horizon,
        .sunrise-screen > .sunrise-sparkle {
          z-index: 1;
        }

        /* Horizon glow that rises with the sun */
        .sunrise-horizon {
          position: absolute;
          left: 50%;
          bottom: -22%;
          width: 140%;
          height: 60%;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at 50% 100%, rgba(167,139,250,.22) 0%, rgba(217,70,239,.08) 40%, rgba(18,5,31, 0) 72%);
          animation: sunrise-horizon-rise 2.2s cubic-bezier(0.22, 0.8, 0.25, 1) both;
          pointer-events: none;
        }

        .sunrise-sun {
          position: relative;
          display: grid;
          place-items: center;
          width: clamp(210px, 62vw, 280px);
          aspect-ratio: 1;
          margin-bottom: 2.1rem;
          animation: sunrise-sun-rise 1.5s cubic-bezier(0.2, 0.85, 0.25, 1) both;
        }
        .sunrise-rays {
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 3px 8px rgba(0, 0, 0, .58)) drop-shadow(0 8px 18px rgba(218, 199, 169, .16));
        }

        .sunrise-sparkle {
          position: absolute;
          border-radius: 9999px;
          background: #FFE9A3;
          box-shadow: 0 0 8px 1px rgba(217,70,239, 0.65);
          opacity: 0;
          animation: sunrise-twinkle var(--sparkle-duration) ease-in-out var(--sparkle-delay) infinite;
        }

        .sunrise-eyebrow {
          margin-bottom:.75rem; color:#F0ABFC;
          font-size:.67rem; font-weight:700; letter-spacing:.28em;
          text-transform:uppercase;
          animation: sunrise-fade-up .8s ease-out .65s both;
        }
        .sunrise-wordmark {
          color: #FBF8FF !important;
          animation: sunrise-fade-up 0.9s ease-out 0.9s both;
          text-shadow:0 0 28px rgba(232, 224, 207, .12);
        }
        .sunrise-greeting {
          animation: sunrise-fade-up 0.9s ease-out 1.3s both;
        }
        .sunrise-tagline {
          animation: sunrise-fade-up 1s ease-out 1.7s both;
        }
        /* Centered loader: progress bar with the status label beneath it. */
        .sunrise-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .8rem;
          margin-top: 2.25rem;
          text-shadow: none !important;
          animation: sunrise-fade-up .7s ease-out 1.1s both;
        }
        .sunrise-bar {
          position: relative;
          width: min(176px, 52vw);
          height: 4px;
          border-radius: 9999px;
          background: rgba(198, 184, 229, 0.16);
          box-shadow: 0 0 0 1px rgba(198, 184, 229, 0.08);
          overflow: hidden;
        }
        .sunrise-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: linear-gradient(90deg, #FFD84D, #F0ABFC 60%, #B99AFF);
          box-shadow: 0 0 10px rgba(255, 216, 77, .55);
          transform-origin: left center;
          animation: sunrise-bar-fill 1.8s cubic-bezier(0.4, 0, 0.2, 1) 1.1s both;
        }
        .sunrise-bar::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 40%;
          z-index: 1;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
          transform: translateX(-120%);
          animation: sunrise-bar-shimmer 1.4s ease-in-out 1.4s infinite;
        }
        .sunrise-waiting {
          margin: 0;
          color: #D6C2F2;
          font-size: .68rem;
          font-weight: 600;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        @keyframes sunrise-horizon-rise {
          from { opacity: 0; transform: translateX(-50%) translateY(38%); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes sunrise-sun-rise {
          from { opacity: 0; transform: translateY(150px) scale(0.55); }
          60%  { opacity: 1; }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sunrise-twinkle {
          0%, 100% { opacity: 0;    transform: scale(0.6); }
          50%      { opacity: 0.95; transform: scale(1); }
        }
        @keyframes sunrise-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sunrise-bar-fill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes sunrise-bar-shimmer {
          from { transform: translateX(-120%); }
          to   { transform: translateX(320%); }
        }

        @media (max-width: 640px) {
          .sunrise-sun { margin-bottom: 1.6rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sunrise-horizon,
          .sunrise-sun,
          .sunrise-rays,
          .sunrise-wordmark,
          .sunrise-greeting,
          .sunrise-tagline,
          .sunrise-eyebrow,
          .sunrise-loader,
          .sunrise-bar::before,
          .sunrise-bar::after {
            animation: none !important;
          }
          .sunrise-sparkle {
            animation: none !important;
            opacity: 0.5;
          }
        }
      `}</style>

      <div className="sunrise-horizon" aria-hidden="true" />

      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="sunrise-sparkle"
          aria-hidden="true"
          style={
            {
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              '--sparkle-delay': `${sparkle.delay}s`,
              '--sparkle-duration': `${sparkle.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}

      <div className="sunrise-sun">
        <div className="sunrise-rays h-full w-full">
          <SunnySun className="h-full w-full" />
        </div>
      </div>

      <p className="sunrise-eyebrow">A little light, just for you</p>
      <h1 className="sunrise-wordmark text-4xl font-bold tracking-tight mb-2">
        Sunny
      </h1>

      <p className="sunrise-greeting text-base font-medium text-white mb-3">
        Hey, sunshine. 💛
      </p>

      <p className="sunrise-tagline max-w-[16rem] text-sm italic leading-relaxed text-[#D8CBEF]">
        You don&rsquo;t have to start over every time you come back.
      </p>

      <div className="sunrise-loader" aria-hidden="true">
        <div className="sunrise-bar" />
        <p className="sunrise-waiting">Getting your sunshine ready</p>
      </div>
    </div>
  );
};