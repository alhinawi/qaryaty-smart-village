// ─── Imports
import React from 'react';

// ─── Types
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'popular' | 'new' | 'success' | 'warning' | 'danger' | 'info';
}

// ─── Component
export function Badge({
  children,
  variant = 'popular',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span className={`q-badge q-badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}
