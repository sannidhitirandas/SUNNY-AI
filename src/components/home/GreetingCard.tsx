import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';

interface GreetingCardProps {
  displayName?: string;
  onTalkPress: () => void;
}

function SunshineIllustration() {
  return (
    <div aria-hidden="true" className="sunny-hero-art relative mx-auto flex h-32 w-full max-w-[260px] items-end justify-center sm:h-40 sm:max-w-[310px] lg:absolute lg:bottom-0 lg:right-5 lg:h-full lg:w-[42%] lg:max-w-none">
      <div className="absolute bottom-3 h-12 w-56 rounded-[50%] bg-[#9B72F2]/35 blur-xl sm:bottom-5 sm:h-16 sm:w-64" />
      <svg viewBox="0 0 280 150" className="relative z-10 h-full w-full overflow-visible" role="presentation">
        <defs>
          <radialGradient id="sunnySunFill" cx="38%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#F5ECFF" />
            <stop offset="58%" stopColor="#B99AFF" />
            <stop offset="100%" stopColor="#7546C8" />
          </radialGradient>
          <linearGradient id="sunnyCloudFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7654A8" />
            <stop offset="100%" stopColor="#302044" />
          </linearGradient>
        </defs>
        <path d="M14 126c4-15 17-18 28-11 4-23 31-28 45-8 14-7 30 2 31 18l20 7H14z" fill="url(#sunnyCloudFill)" opacity=".9"/>
        <path d="M160 128c2-13 14-19 26-12 8-19 32-17 39 2 12-5 24 3 25 13l14 3H160z" fill="url(#sunnyCloudFill)" opacity=".9"/>
        <ellipse cx="142" cy="72" rx="62" ry="54" fill="none" stroke="#B99AFF" strokeOpacity=".32" transform="rotate(-18 142 72)"/>
        <g transform="translate(140 69)">
          {Array.from({length:16},(_,i)=><ellipse key={i} cx="0" cy="-34" rx="10" ry="16" fill="url(#sunnySunFill)" transform={`rotate(${i*22.5})`}/>)}
          <circle r="36" fill="url(#sunnySunFill)"/>
          <path d="M-17 -2q5-9 10 0M7 -2q5-9 10 0" fill="none" stroke="#49316F" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M-10 9q10 12 20 0" fill="none" stroke="#49316F" strokeWidth="3.5" strokeLinecap="round"/>
          <ellipse cx="-22" cy="7" rx="6" ry="3" fill="#E8A8D2" opacity=".7"/>
          <ellipse cx="22" cy="7" rx="6" ry="3" fill="#E8A8D2" opacity=".7"/>
        </g>
        <path d="M57 28l2.5 6.5L66 37l-6.5 2.5L57 46l-2.5-6.5L48 37l6.5-2.5zM224 19l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#D7C2FF"/>
      </svg>
    </div>
  );
}

export const GreetingCard: React.FC<GreetingCardProps> = ({
  displayName = 'sunshine',
  onTalkPress,
}) => {
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <AppCard elevated className="sunny-home-hero relative isolate overflow-hidden rounded-[30px] border border-[#A78BFA]/30 bg-gradient-to-br from-[#38245E] via-[#211638] to-[#100B22] p-5 sm:p-7 lg:min-h-[270px] lg:p-9">
      <div className="sunny-hero-glow pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#A78BFA]/20 blur-3xl" />
      <div className="relative z-20 flex items-center justify-between lg:mb-5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-[#E9DEFF]">
          <Sparkles size={16} className="text-[#C4A8FF]" /> YOUR LITTLE CORNER OF SUNSHINE
        </span>
        <span className="hidden items-center gap-2 text-xs text-[#D6C7F2] sm:inline-flex"><Sparkles size={14} className="text-[#C4A8FF]"/> A little space just for you</span>
      </div>
      <div className="relative z-20 lg:max-w-[58%]">
        <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-[#FBF8FF] sm:text-5xl lg:mt-0 lg:text-[3.65rem]">
          {greeting}, {displayName || 'sunshine'}
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#D8CBEF] sm:text-lg">
          A little warmth, just for you. Whatever kind of day it’s been, you’re welcome here.
        </p>
        <div className="mt-3 lg:mt-7">
          <AppButton
            title="Talk to Sunny"
            onPress={onTalkPress}
            variant="primary"
            size="large"
            icon={<MessageCircle size={18} className="text-white" />}
            className="sunny-purple-cta w-full shadow-[0_8px_28px_rgba(155,114,242,0.28)] sm:w-auto sm:min-w-[190px]"
          />
        </div>
      </div>
      <SunshineIllustration />
    </AppCard>
  );
};
