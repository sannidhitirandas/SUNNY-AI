import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AppInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: string;
  autoCapitalize?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  disabled?: boolean;
  containerStyle?: string;
}

// 16px (text-base) input text also stops mobile browsers from zooming in on focus.
const FIELD_CLASSES =
  'w-full bg-[#1B1430] border border-[#392858] hover:border-[#4b3570] focus:border-[#FFD84D] focus:outline-none focus:ring-2 focus:ring-[#FFD84D]/20 text-white placeholder-white/50 text-base rounded-xl px-4 py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed';

export const AppInput: React.FC<AppInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  multiline = false,
  numberOfLines = 3,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  autoFocus = false,
  maxLength,
  disabled = false,
  containerStyle = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = React.useId();

  return (
    <div className={`flex flex-col mb-4 ${containerStyle}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-white/90 mb-2 ml-0.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {multiline ? (
          <textarea
            id={inputId}
            rows={numberOfLines}
            value={value}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            maxLength={maxLength}
            disabled={disabled}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            className={`${FIELD_CLASSES} resize-none`}
          />
        ) : (
          <>
            <input
              id={inputId}
              type={isPassword ? (showPassword ? 'text' : 'password') : keyboardType === 'email-address' ? 'email' : 'text'}
              inputMode={keyboardType === 'email-address' ? 'email' : undefined}
              value={value}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder={placeholder}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              autoFocus={autoFocus}
              maxLength={maxLength}
              disabled={disabled}
              spellCheck={false}
              className={`${FIELD_CLASSES} ${isPassword ? 'pr-12' : ''}`}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full text-[#9B8AB9] hover:text-[#C6B8E5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84D]/40 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};