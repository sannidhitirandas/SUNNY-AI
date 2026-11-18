import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { SunnyRobot3D } from '@/components/brand/SunnyRobot3D';

interface GreetingCardProps {
  displayName?: string;
  onTalkPress: () => void;
}

function SunnyRobotArtwork() {
  return (
    <div aria-hidden="true" className="sunny-hero-art relative mx-auto flex h-36 w-full max-w-[270px] items-center justify-center sm:h-44 sm:max-w-[320px] lg:absolute lg:bottom-0 lg:right-3 lg:h-full lg:w-[43%] lg:max-w-none">
      <SunnyRobot3D className="relative z-10 h-full w-full" />
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
    <AppCard elevated className="sunny-home-hero relative isolate overflow-hidden rounded-[30px] border border-[#A78BFA]/30 bg-gradient-to-br from-[#38245E] via-[#211638] to-[#12051F] p-5 sm:p-7 lg:min-h-[300px] lg:p-9">
      <div className="sunny-hero-glow pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#A78BFA]/20 blur-3xl" />
      <div className="relative z-20 flex items-center justify-between lg:mb-5">
        <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-[#E9DEFF]">
          <Sparkles size={16} className="sunny-shine" /> YOUR LITTLE CORNER OF SUNSHINE
        </span>
        <span className="hidden items-center gap-2 text-xs text-[#D6C7F2] sm:inline-flex"><Sparkles size={14} className="sunny-shine"/> A little space just for you</span>
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
      <SunnyRobotArtwork />
    </AppCard>
  );
};
