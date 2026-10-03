import React from 'react';
import { SunnyLogo } from '@/components/brand/SunnyLogo';
import { AppCard } from '@/components/ui/AppCard';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft } from 'lucide-react';

interface AboutScreenProps {
  onBack: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 max-w-xl mx-auto w-full pb-24">
      {/* Top Bar */}
      <div className="flex items-center gap-3 py-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#21163A] border border-[#392858] text-[#C6B8E5] hover:text-white transition-colors cursor-pointer"
          aria-label="Back to settings"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">About Sunny</h1>
      </div>

      {/* Brand Hero */}
      <div className="flex flex-col items-center py-6 text-center">
        <SunnyLogo size="large" />
        <h2 className="text-2xl font-bold text-white mt-3">Sunny</h2>
        <p className="text-sm text-[#C6B8E5] mt-0.5">A Personal AI Companion</p>
        <div className="mt-2.5">
          <Badge label={`Version ${__APP_VERSION__} · Web & Android`} variant="yellow" />
        </div>
      </div>

      {/* Vision Card */}
      <AppCard className="p-5 mb-4">
        <h3 className="text-base font-bold text-white mb-2">The Vision</h3>
        <p className="text-xs sm:text-sm text-[#C6B8E5] leading-relaxed">
          Sunny is an AI companion for everyday conversation, reflection, and gentle encouragement. When memory is enabled, it can save useful details you share for future conversations.
        </p>
        <div className="mt-4 p-3 rounded-xl bg-[#17102C] border border-[#FFD84D]/25 text-center">
          <p className="text-xs sm:text-sm italic text-[#FFD84D]">
            "You don't have to start over every time you come back."
          </p>
        </div>
      </AppCard>

      {/* Core Principles */}
      <AppCard className="p-5 mb-4">
        <h3 className="text-base font-bold text-white mb-3">Core Principles</h3>
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold text-[#FFD84D]">1. Emotional Safety</h4>
            <p className="text-xs text-[#C6B8E5] leading-relaxed mt-0.5">
              Nonjudgmental, empathetic, and clear about being an AI without masquerading as human or therapist.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFD84D]">2. Transparent Memory</h4>
            <p className="text-xs text-[#C6B8E5] leading-relaxed mt-0.5">
              Nothing is saved secretly. Every memory is visible, editable, and deletable by you.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFD84D]">3. Gentle Encouragement</h4>
            <p className="text-xs text-[#C6B8E5] leading-relaxed mt-0.5">
              No streaks, no guilt trips, no pressure. Sunny is here when you need it, and quiet when you don't.
            </p>
          </div>
        </div>
      </AppCard>
    </div>
  );
};
