// ─── Imports
import React from 'react';
import { triggerHapticFeedback } from '@/utils/helpers';

// ─── Types
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'ghost'
    | 'gold'
    | 'success';
  size?: 'sm' | 'md' | 'lg';
  enableHaptic?: boolean;
  loading?: boolean;
}

// ─── Component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      enableHaptic = true,
      loading = false,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableHaptic && !disabled && !loading) {
        triggerHapticFeedback();
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        className={`q-btn q-btn-${variant} q-btn-${size} ${className}`}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <span className="q-spinner" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
