import React from 'react';
import { MessageSquare } from 'lucide-react';
import { AppCard } from '../ui/AppCard';
import { AppButton } from '../ui/AppButton';
import { SunnyLogo } from '../brand/SunnyLogo';

interface GreetingCardProps {
  displayName?: string;
  onTalkPress: () => void;
}

export const GreetingCard: React.FC<GreetingCardProps> = ({
  displayName = 'sunshine',
  onTalkPress,
}) => {
  return (
    <AppCard elevated className="p-5 sm:p-6 border-[#FFD84D]/30 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <SunnyLogo size="medium" />
        <span className="bg-[#FFD84D]/10 text-[#FFD84D] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#FFD84D]/25">
          Safe & Private Space
        </span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-1">
        Hey, {displayName || 'sunshine'}. 💛
      </h1>
      <h2 className="text-lg font-semibold text-[#FFD84D] mb-2">
        How are you feeling today?
      </h2>
      <p className="text-sm text-[#C6B8E5] leading-relaxed mb-5">
        No pressure to be okay. We can talk, laugh, or just take things one moment at a time.
      </p>

      <AppButton
        title="Talk to Sunny"
        onPress={onTalkPress}
        variant="primary"
        size="large"
        icon={<MessageSquare size={18} className="text-[#100B22]" />}
        className="w-full sm:w-auto"
      />
    </AppCard>
  );
};
