import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AppCard } from '../ui/AppCard';

const DAILY_REMINDERS = [
  "You don't have to figure everything out today. One small step is enough.",
  'Taking a break is not giving up. It is giving yourself room to breathe.',
  'Be proud of yourself for showing up today, even in quiet, gentle ways.',
  "Whatever pace you are moving at right now is completely okay.",
  'You are allowed to take things one breath and one moment at a time.',
  "You don't have to carry the whole mountain today. Just the next gentle step.",
];

export const DailySunshineCard: React.FC = () => {
  const [index, setIndex] = useState<number>(0);

  return (
    <AppCard className="sunny-daily-card my-5 rounded-[24px] border border-[#7C6394]/30 bg-gradient-to-r from-[#302044] via-[#261B3A] to-[#211633] p-4 shadow-[0_10px_30px_rgba(0,0,0,.14)] sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFD84D]">
          Little reminder 💛
        </span>
        <button
          type="button"
          onClick={() => setIndex((prev) => (prev + 1) % DAILY_REMINDERS.length)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD84D]/20 bg-[#FFD84D]/10 px-3 py-1.5 text-xs font-semibold text-[#FFD84D] transition-all hover:border-[#FFD84D]/40 hover:bg-[#FFD84D]/20 active:scale-95 cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Another ☀️</span>
        </button>
      </div>
      <p key={index} className="sunny-reminder-text text-[15px] leading-relaxed text-[#F5EDFF] sm:text-xl">
        "{DAILY_REMINDERS[index]}"
      </p>
    </AppCard>
  );
};
