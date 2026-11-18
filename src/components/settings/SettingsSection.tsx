import React, { useId } from 'react';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="sunny-settings-section mb-6">
      <h2 id={headingId} className="mb-2 px-4 text-[11px] font-bold tracking-[0.16em] text-[#B9AACA] uppercase">
        {title}
      </h2>
      <div className="sunny-settings-panel overflow-hidden rounded-[22px] border border-[#604477]/40 bg-gradient-to-br from-[#241936] to-[#191229] shadow-[0_10px_28px_rgba(0,0,0,.12)] divide-y divide-[#604477]/25">
        {children}
      </div>
    </section>
  );
};
