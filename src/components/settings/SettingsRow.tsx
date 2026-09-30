import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightText?: string;
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
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  onPress,
  showChevron = true,
  destructive = false,
}) => {
  const isClickable = !isSwitch && !!onPress;

  return (
    <div
      onClick={isClickable ? onPress : undefined}
      className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
        isClickable ? 'hover:bg-[#2b1d4a] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-[#302149] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm font-medium block truncate ${
              destructive ? 'text-[#FF8D9A]' : 'text-white'
            }`}
          >
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-[#9B8AB9] block truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightText && (
          <span className="text-xs font-semibold text-[#FFD84D]">
            {rightText}
          </span>
        )}

        {isSwitch && (
          <button
            type="button"
            role="switch"
            aria-checked={switchValue}
            onClick={() => onSwitchChange && onSwitchChange(!switchValue)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              switchValue ? 'bg-[#FFD84D]' : 'bg-[#17102C] border border-[#392858]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
                switchValue
                  ? 'translate-x-5 bg-[#100B22]'
                  : 'translate-x-0 bg-[#9B8AB9]'
              }`}
            />
          </button>
        )}

        {!isSwitch && showChevron && onPress && (
          <ChevronRight size={18} className="text-[#9B8AB9]" />
        )}
      </div>
    </div>
  );
};
