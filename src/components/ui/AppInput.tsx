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
    <div className={`flex flex-col mb-3 ${containerStyle}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-white/90 mb-1.5 ml-0.5">
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
            className="w-full bg-[#1B1430] border border-[#392858] focus:border-[#FFD84D] focus:outline-none text-white placeholder-white/60 text-sm rounded-xl px-3.5 py-2.5 transition-colors resize-none"
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
              className="w-full bg-[#1B1430] border border-[#392858] focus:border-[#FFD84D] focus:outline-none text-white placeholder-white/60 text-sm rounded-xl px-3.5 py-2.5 transition-colors pr-10"
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#9B8AB9] hover:text-[#C6B8E5] transition-colors focus:outline-none p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
