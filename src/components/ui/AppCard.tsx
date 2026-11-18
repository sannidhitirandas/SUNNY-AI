import React from 'react';

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
  onPress?: () => void;
  padding?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  elevated = false,
  onPress,
  className = '',
  ...props
}) => {
  const isClickable = !!onPress;

  return (
    <div
      onClick={onPress}
      onKeyDown={isClickable ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPress?.(); } } : undefined}
      role={isClickable ? 'button' : props.role}
      tabIndex={isClickable ? 0 : props.tabIndex}
      data-card-interactive={isClickable ? 'true' : undefined}
      className={`sunny-app-card rounded-2xl border transition-all duration-200 ${
        elevated
          ? 'bg-[#2D1450] border-[#4D2C78] shadow-lg'
          : 'bg-[#25103F] border-[#4A2A73]'
      } ${
        isClickable
          ? 'cursor-pointer hover:border-[#D946EF]/50 hover:bg-[#31175A] active:scale-[0.99]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
