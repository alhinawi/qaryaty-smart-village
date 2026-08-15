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
    <div className="empty-state-container" role="status">
      <div className="empty-state-icon">
        {emoji ? (
          <span role="img" aria-hidden="true">
            {emoji}
          </span>
        ) : (
          icon
        )}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
