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

    const baseClasses = "inline-flex items-center justify-center gap-2 rounded-[14px] font-['Cairo',sans-serif] font-extrabold cursor-pointer transition-all duration-200 border-none no-underline disabled:opacity-50 disabled:pointer-events-none";
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-[0.8125rem]',
      md: 'px-5 py-2.5 text-[0.9375rem]',
      lg: 'px-6 py-3.5 text-base',
    };

    const variantClasses = {
      primary: 'bg-gradient-to-br from-green to-green-light text-white shadow-[0_4px_16px_rgba(26,122,74,0.25)] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(26,122,74,0.35)]',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300', // Added fallback as it was missing from CSS
      gold: 'bg-gold text-black hover:bg-gold-light hover:scale-[1.02]',
      outline: 'bg-transparent border-2 border-[rgba(26,122,74,0.3)] text-green hover:bg-[rgba(26,122,74,0.08)]',
      ghost: 'bg-transparent text-green hover:bg-[rgba(26,122,74,0.08)]',
      danger: 'bg-danger text-white hover:bg-red-600', // Added fallback
      success: 'bg-success text-white hover:bg-green-600', // Added fallback
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
