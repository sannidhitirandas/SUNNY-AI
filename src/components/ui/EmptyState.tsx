import React from 'react';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
      {icon && <div className="mb-4 text-[#FFD84D]">{icon}</div>}
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-xs text-[#C6B8E5] leading-relaxed mb-5">{description}</p>
      {actionTitle && onAction && (
        <AppButton
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
          size="small"
        />
      )}
    </div>
  );
};
