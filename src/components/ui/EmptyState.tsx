// ─── Imports
import React from 'react';
import { Button } from './Button';

// ─── Types
interface EmptyStateProps {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

// ─── Component
export function EmptyState({
  emoji,
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-10 px-6" role="status">
      <div className="text-[48px] mb-3">
        {emoji ? (
          <span role="img" aria-hidden="true">
            {emoji}
          </span>
        ) : (
          icon
        )}
      </div>
      <h3 className="text-xl font-extrabold text-text mb-1.5">{title}</h3>
      <p className="text-sm text-text-muted max-w-[360px] mx-auto mb-5 leading-normal">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
