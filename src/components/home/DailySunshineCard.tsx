import React from 'react';

const DAILY_REMINDERS = [
  "You don't have to figure everything out today. One small step is enough.",
  'Taking a break is not giving up. It is giving yourself room to breathe.',
  'Be proud of yourself for showing up today, even in quiet, gentle ways.',
  "Whatever pace you are moving at right now is completely okay.",
  'You are allowed to take things one breath and one moment at a time.',
  "You don't have to carry the whole mountain today. Just the next gentle step.",
];

export const DailySunshineCard: React.FC = () => {
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_REMINDERS.length;

  return (
    <section className="sunny-daily-reminder my-3 px-1 sm:px-2" aria-label="Little reminder">
      <p className="sunny-reminder-text text-xs leading-relaxed text-[#F5EDFF]/75 sm:text-sm">
        {DAILY_REMINDERS[dayIndex]}
      </p>
    </section>
  );
};
