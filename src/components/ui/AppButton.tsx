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
        return 'bg-[#21163A] hover:bg-[#302149] text-white border border-[#392858] active:bg-[#17102C]';
      case 'ghost':
        return 'bg-transparent hover:bg-white/5 text-[#C6B8E5] hover:text-white border-transparent';
      case 'danger':
        return 'bg-[#FF8D9A]/15 hover:bg-[#FF8D9A]/25 text-[#FF8D9A] border border-[#FF8D9A]/30';
      case 'primary':
      default:
        return 'bg-[#FFD84D] hover:bg-[#F6BD45] text-[#100B22] font-semibold shadow-[0_2px_12px_rgba(255,216,77,0.25)] active:scale-[0.98]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'py-1.5 px-3.5 text-xs rounded-xl';
      case 'large':
        return 'py-3.5 px-6 text-base rounded-2xl';
      case 'medium':
      default:
        return 'py-2.5 px-4 text-sm rounded-xl';
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${getVariantStyles()} ${getSizeStyles()} ${fullWidth ? 'w-full' : ''} ${className}`}
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
