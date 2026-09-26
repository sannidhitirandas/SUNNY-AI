import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'yellow' | 'purple' | 'green' | 'muted';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'yellow',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'purple':
        return 'bg-[#302149] text-[#C6B8E5] border border-[#392858]';
      case 'green':
        return 'bg-[#A8D9A0]/15 text-[#A8D9A0] border border-[#A8D9A0]/30';
      case 'muted':
        return 'bg-white/5 text-[#9B8AB9] border border-white/10';
      case 'yellow':
      default:
        return 'bg-[#FFD84D]/15 text-[#FFD84D] border border-[#FFD84D]/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase select-none ${getVariantStyles()} ${className}`}
    >
      {label}
    </span>
  );
};
