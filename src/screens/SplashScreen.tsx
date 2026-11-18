import React, { useEffect } from 'react';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
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
  const splashVideoRef = React.useRef<HTMLVideoElement | null>(null);

  // Keep the splash background video playing on mobile browsers where autoplay
  // may be deferred until media is ready or the page returns to the foreground.
  useEffect(() => {
    const video = splashVideoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const tryPlay = () => {
      if (document.visibilityState !== 'visible') return;
      const playback = video.play();
      if (playback) playback.catch(() => {
        // Respect browser autoplay restrictions and retain the background fallback.
      });
    };

    tryPlay();
    video.addEventListener('canplay', tryPlay);
    document.addEventListener('visibilitychange', tryPlay);
    window.addEventListener('pageshow', tryPlay);
    return () => {
      video.removeEventListener('canplay', tryPlay);
      document.removeEventListener('visibilitychange', tryPlay);
      window.removeEventListener('pageshow', tryPlay);
    };
  }, []);

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
          background: transparent;
        }
        .sunrise-video-backdrop {
          position: absolute;
          z-index: 0;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          background: #100B22;
        }
        .sunrise-background-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 1;
          filter: brightness(0.58) saturate(0.88);
          transform: scale(1.01);
        }
        .sunrise-video-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(10, 7, 24, 0.58) 0%, rgba(15, 9, 32, 0.34) 42%, rgba(10, 7, 24, 0.62) 100%),
            radial-gradient(ellipse at 50% 48%, rgba(17, 10, 35, 0.12) 0%, rgba(10, 7, 24, 0.42) 100%);
        }
        .sunrise-screen > .sunrise-sun,
        .sunrise-screen > .sunrise-eyebrow,
        .sunrise-screen > .sunrise-wordmark,
        .sunrise-screen > .sunrise-greeting,
        .sunrise-screen > .sunrise-tagline,
        .sunrise-screen > .sunrise-waiting,
        .sunrise-screen > .sunrise-bar {
          position: relative;
          z-index: 3;
          text-shadow: 0 2px 5px rgba(0, 0, 0, 0.95), 0 4px 24px rgba(0, 0, 0, 0.9);
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
          background: radial-gradient(ellipse at 50% 100%, rgba(255, 216, 77, 0.38) 0%, rgba(246, 189, 69, 0.16) 40%, rgba(16, 11, 34, 0) 72%);
          animation: sunrise-horizon-rise 2.2s cubic-bezier(0.22, 0.8, 0.25, 1) both;
          pointer-events: none;
        }

        /* Soft pulsing halo behind the sun */
        .sunrise-halo {
          position: absolute;
          inset: -46px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255, 216, 77, 0.62) 0%, rgba(246, 189, 69, 0.28) 48%, rgba(255, 216, 77, 0) 74%);
          filter: drop-shadow(0 0 24px rgba(255, 196, 55, 0.55));
          animation: sunrise-halo-pulse 3.2s ease-in-out 1.2s infinite;
        }
        .sunrise-sun::before {
          content: '';
          position: absolute;
          inset: 23%;
          border-radius: 50%;
          z-index: 0;
          background: radial-gradient(circle at 38% 32%, #FFF4B5 0%, #FFD84D 48%, #E99B27 100%);
          border: 1px solid rgba(255, 246, 195, 0.9);
          box-shadow: 0 0 26px rgba(255, 205, 66, 0.7), 0 0 70px rgba(255, 185, 54, 0.38), inset 0 -8px 18px rgba(174, 91, 18, 0.2);
        }

        .sunrise-sun {
          position: relative;
          display: grid;
          place-items: center;
          width: clamp(148px, 42vw, 190px);
          aspect-ratio: 1;
          margin-bottom: 2.1rem;
          animation: sunrise-sun-rise 1.5s cubic-bezier(0.2, 0.85, 0.25, 1) both;
        }
        .sunrise-orbit {
          position:absolute; inset:4px;
          border:1px solid rgba(255,232,166,.22);
          border-radius:9999px;
          box-shadow:0 0 34px rgba(255,216,77,.09),inset 0 0 28px rgba(255,216,77,.045);
        }
        .sunrise-orbit::before,.sunrise-orbit::after {
          content:''; position:absolute; width:7px;height:7px;border-radius:50%;
          background:#FFE9A3; box-shadow:0 0 12px 3px rgba(255,216,77,.55);
        }
        .sunrise-orbit::before { top:18%;right:13%; }
        .sunrise-orbit::after { bottom:17%;left:12%;width:4px;height:4px; }
        .sunrise-rays {
          position:relative; z-index:1;
          filter:drop-shadow(0 4px 8px rgba(30, 15, 12, .72)) drop-shadow(0 12px 30px rgba(255,190,64,.38));
          animation: sunrise-rays-spin 42s linear infinite;
        }

        .sunrise-sparkle {
          position: absolute;
          border-radius: 9999px;
          background: #FFE9A3;
          box-shadow: 0 0 8px 1px rgba(255, 216, 77, 0.65);
          opacity: 0;
          animation: sunrise-twinkle var(--sparkle-duration) ease-in-out var(--sparkle-delay) infinite;
        }

        .sunrise-eyebrow {
          margin-bottom:.75rem; color:#FFF1B8;
          font-size:.67rem; font-weight:700; letter-spacing:.28em;
          text-transform:uppercase;
          animation: sunrise-fade-up .8s ease-out .65s both;
        }
        .sunrise-wordmark {
          animation: sunrise-fade-up 0.9s ease-out 0.9s both;
          text-shadow:0 0 34px rgba(255,216,77,.18);
        }
        .sunrise-greeting {
          animation: sunrise-fade-up 0.9s ease-out 1.3s both;
        }
        .sunrise-tagline {
          animation: sunrise-fade-up 1s ease-out 1.7s both;
        }
        .sunrise-waiting {
          margin-top:2rem; color:#F2EAFE;
          font-size:.68rem; letter-spacing:.13em;
          animation:sunrise-fade-up .7s ease-out 2s both;
        }
        .sunrise-waiting::after {
          content:''; display:inline-block; width:16px; height:1px;
          margin-left:8px; vertical-align:middle;
          background:linear-gradient(90deg,#FFD84D,transparent);
          animation:sunrise-waiting-pulse 1.2s ease-in-out infinite;
        }

        .sunrise-bar {
          position: absolute;
          left: 50%;
          bottom: max(env(safe-area-inset-bottom, 0px), 28px);
          width: 72px;
          height: 3px;
          margin-left: -36px;
          border-radius: 9999px;
          background: rgba(198, 184, 229, 0.18);
          overflow: hidden;
          animation: sunrise-fade-up 0.6s ease-out 0.4s both;
        }
        .sunrise-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: linear-gradient(90deg, #F6BD45, #FFD84D);
          transform-origin: left center;
          animation: sunrise-bar-fill 2.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
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
        @keyframes sunrise-halo-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%      { transform: scale(1.14); opacity: 1; }
        }
        @keyframes sunrise-rays-spin {
          to { transform: rotate(360deg); }
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
        @keyframes sunrise-waiting-pulse {
          0%,100% { opacity:.3; transform:scaleX(.55); transform-origin:left; }
          50% { opacity:1; transform:scaleX(1); transform-origin:left; }
        }

        @media (max-width: 640px) {
          .sunrise-video-backdrop { position: absolute; inset: 0; width: 100vw; height: 100dvh; }
          .sunrise-background-video { display: block; width: 100%; height: 100%; min-width: 100%; min-height: 100%; object-fit: cover; object-position: center center; transform: translateZ(0) scale(1.01); }
          .sunrise-video-overlay { background: linear-gradient(180deg, rgba(10, 7, 24, 0.62), rgba(15, 9, 32, 0.38) 48%, rgba(10, 7, 24, 0.68)); }
          .sunrise-sun { margin-bottom: 1.6rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sunrise-horizon,
          .sunrise-halo,
          .sunrise-sun,
          .sunrise-rays,
          .sunrise-wordmark,
          .sunrise-greeting,
          .sunrise-tagline,
          .sunrise-eyebrow,
          .sunrise-waiting,
          .sunrise-bar,
          .sunrise-bar::after {
            animation: none !important;
          }
          .sunrise-sparkle {
            animation: none !important;
            opacity: 0.5;
          }
        }
      `}</style>

      <div className="sunrise-video-backdrop" aria-hidden="true">
        <video ref={splashVideoRef} className="sunrise-background-video" autoPlay muted loop playsInline preload="metadata">
          <source src="/sunny-home-background.mp4" type="video/mp4" />
        </video>
        <span className="sunrise-video-overlay" />
      </div>

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
        <div className="sunrise-halo" aria-hidden="true" />
        <div className="sunrise-orbit" aria-hidden="true" />
        <div className="sunrise-rays">
          <SunnyLogo size="huge" />
        </div>
      </div>

      <p className="sunrise-eyebrow">A little light, just for you</p>
      <h1 className="sunrise-wordmark text-4xl font-bold tracking-tight text-[#FFD84D] mb-2">
        Sunny
      </h1>

      <p className="sunrise-greeting text-base font-medium text-white mb-3">
        Hey, sunshine. 💛
      </p>

      <p className="sunrise-tagline max-w-[16rem] text-sm italic leading-relaxed text-[#C6B8E5]">
        You don&rsquo;t have to start over every time you come back.
      </p>
      <p className="sunrise-waiting" aria-hidden="true">GETTING YOUR SUNSHINE READY</p>

      <div className="sunrise-bar" aria-hidden="true" />
    </div>
  );
};