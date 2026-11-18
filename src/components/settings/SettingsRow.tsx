import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightText?: string;
  rightContent?: React.ReactNode;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  subtitle,
  icon,
  rightText,
  rightContent,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  onPress,
  showChevron = true,
  destructive = false,
}) => {
  const isClickable = !isSwitch && !!onPress;
  const subtitleId = React.useId();
  const rowContent = (
    <>
      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
        {icon && (
          <div aria-hidden="true" className="sunny-settings-icon w-9 h-9 rounded-[13px] bg-[#381A60] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium block truncate ${destructive ? 'text-[#FF8D9A]' : 'text-white'}`}>
            {title}
          </span>
          {subtitle && (
            <span id={subtitleId} className="mt-0.5 block truncate text-xs text-[#B9AACA]">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightContent}
        {!rightContent && rightText && (
          <span className="text-xs font-semibold text-[#E879F9]">{rightText}</span>
        )}
        {isSwitch && (
          <button
            type="button"
            role="switch"
            aria-label={title}
            aria-describedby={subtitle ? subtitleId : undefined}
            aria-checked={switchValue}
            onClick={() => onSwitchChange?.(!switchValue)}
            className="relative inline-flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E879F9]"
          >
            <span
              aria-hidden="true"
              className={`absolute inset-x-1 top-1/2 h-6 -translate-y-1/2 rounded-full ${switchValue ? 'bg-[#E879F9]' : 'bg-[#1A0A2E] border border-[#4A2A73]'}`}
            />
            <span
              aria-hidden="true"
              className={`absolute left-1 top-1/2 inline-block h-5 w-5 -translate-y-1/2 transform rounded-full shadow-lg transition duration-200 ${
                switchValue ? 'translate-x-5 bg-[#12051F]' : 'translate-x-0 bg-[#AA92CC]'
              }`}
            />
          </button>
        )}
        {!isSwitch && showChevron && onPress && (
          <ChevronRight aria-hidden="true" size={18} className="text-white/80" />
        )}
      </div>
    </>
  );
  const className = `sunny-settings-row flex min-h-[72px] w-full items-center justify-between px-4 py-3.5 text-left transition-colors ${
    isClickable ? 'cursor-pointer hover:bg-white/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#E879F9]' : ''
  }`;

  return (
    isClickable
      ? <button type="button" onClick={onPress} className={className}>{rowContent}</button>
      : <div className={className}>{rowContent}</div>
  );
};
