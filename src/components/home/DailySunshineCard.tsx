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
    <AppCard className="sunny-daily-card my-5 rounded-[24px] border border-[#8B6AC0]/25 bg-gradient-to-r from-[#2B1E45] via-[#241936] to-[#1B142C] p-4 shadow-[0_10px_30px_rgba(0,0,0,.14)] sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C4A8FF]">
          Little reminder
        </span>
        <button
          type="button"
          onClick={() => setIndex((prev) => (prev + 1) % DAILY_REMINDERS.length)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#A78BFA]/30 bg-[#8B5CF6]/15 px-3 py-1.5 text-xs font-semibold text-[#DCCBFF] transition-all hover:border-[#C4A8FF]/60 hover:bg-[#8B5CF6]/25 active:scale-95"
        >
          <Sparkles size={13} />
          <span>Another</span>
        </button>
      </div>
      <p key={index} className="sunny-reminder-text text-[15px] leading-relaxed text-[#F5EDFF] sm:text-xl">
        “{DAILY_REMINDERS[index]}”
      </p>
    </AppCard>
  );
};
