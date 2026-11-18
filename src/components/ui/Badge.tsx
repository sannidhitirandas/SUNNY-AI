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
        return 'bg-[#381A60] text-[#D6C2F2] border border-[#4A2A73]';
      case 'green':
        return 'bg-[#A8D9A0]/15 text-[#A8D9A0] border border-[#A8D9A0]/30';
      case 'muted':
        return 'bg-white/5 text-[#AA92CC] border border-white/10';
      case 'yellow':
      default:
        return 'bg-[#D946EF]/15 text-[#D946EF] border border-[#D946EF]/30';
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
