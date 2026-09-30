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
      className={`rounded-2xl border transition-all duration-200 ${
        elevated
          ? 'bg-[#261a42] border-[#3e2c60] shadow-lg'
          : 'bg-[#21163A] border-[#392858]'
      } ${
        isClickable
          ? 'cursor-pointer hover:border-[#FFD84D]/50 hover:bg-[#2b1d4a] active:scale-[0.99]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
