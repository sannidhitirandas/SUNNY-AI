import React from 'react';
import { audioService } from '@/services/audioService';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onPress?: (e?: any) => void;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  disabled,
  onPress,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      void audioService.play('button');
    }
    if (onPress) {
      onPress(e);
    } else if (onClick) {
      onClick(e);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-[#25103F] hover:bg-[#381A60] text-white border border-[#4A2A73] active:bg-[#1A0A2E]';
      case 'ghost':
        return 'bg-transparent hover:bg-white/5 text-[#D6C2F2] hover:text-white border-transparent';
      case 'danger':
        return 'bg-[#FF8D9A]/15 hover:bg-[#FF8D9A]/25 text-[#FF8D9A] border border-[#FF8D9A]/30';
      case 'primary':
      default:
        return 'bg-gradient-to-r from-[#8B2BE2] to-[#D946EF] hover:from-[#9B3BF2] hover:to-[#E879F9] text-white font-semibold shadow-[0_6px_20px_rgba(217,70,239,0.35)] active:scale-[0.98]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'py-1.5 px-3.5 text-xs rounded-full';
      case 'large':
        return 'py-3.5 px-6 text-base rounded-full';
      case 'medium':
      default:
        return 'py-2.5 px-4 text-sm rounded-full';
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className={`sunny-app-button inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${getVariantStyles()} ${getSizeStyles()} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2 inline-flex items-center">{icon}</span>
      ) : null}
      <span>{title}</span>
    </button>
  );
};
