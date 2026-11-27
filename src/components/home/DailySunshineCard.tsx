import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

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
    <section className="sunny-daily-reminder my-5 px-1 sm:px-2" aria-label="Little reminder">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] sunny-shine">
          Little reminder
        </span>
        <button
          type="button"
          onClick={() => setIndex((prev) => (prev + 1) % DAILY_REMINDERS.length)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E879F9]/30 bg-[#E879F9]/10 px-3 py-1.5 text-xs font-semibold text-[#FFE29A] transition-all hover:border-[#E879F9]/60 hover:bg-[#E879F9]/15 active:scale-95"
        >
          <Sparkles size={13} className="sunny-shine" />
          <span>Another</span>
        </button>
      </div>
      <p key={index} className="sunny-reminder-text text-[15px] leading-relaxed text-[#F5EDFF] sm:text-xl">
        “{DAILY_REMINDERS[index]}”
      </p>
    </section>
};
