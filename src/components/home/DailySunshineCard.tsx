import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AppCard } from '../ui/AppCard';

const DAILY_REMINDERS = [
  "You don't have to figure everything out today. One small step is enough.",
  'Taking a break is not giving up. It is giving yourself room to breathe.',
  'Be proud of yourself for showing up today, even in quiet, gentle ways.',
  "Whatever pace you are moving at right now is completely okay.",
  "You are allowed to take things one breath and one moment at a time.",
  "You don't have to carry the whole mountain today. Just the next gentle step.",
];

export const DailySunshineCard: React.FC = () => {
  const [index, setIndex] = useState<number>(0);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % DAILY_REMINDERS.length);
  };

  return (
    <AppCard className="p-4 my-3 bg-[#17102C] border-[#FFD84D]/25">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#FFD84D]">
          Little reminder 💛
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FFD84D]/15 text-[#FFD84D] text-xs font-semibold hover:bg-[#FFD84D]/25 transition-colors cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Another ☀️</span>
        </button>
      </div>
      <p className="text-sm italic text-white leading-relaxed">
        "{DAILY_REMINDERS[index]}"
      </p>
    </AppCard>
  );
};
