import React, { useId } from 'react';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="mb-6">
      <h2 id={headingId} className="text-[11px] font-bold tracking-wider text-[#9B8AB9] uppercase px-4 mb-2">
        {title}
      </h2>
      <div className="bg-[#21163A] border border-[#392858] rounded-2xl overflow-hidden divide-y divide-[#392858]/60">
        {children}
      </div>
    </section>
  );
};
