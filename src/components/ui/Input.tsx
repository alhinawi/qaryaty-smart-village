// ─── Imports
import React from 'react';

// ─── Types
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

// ─── Component
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}_error`;
    const describedBy = [props['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined;

    return (
      <div className="form-group">
        {label && <label htmlFor={inputId}>{label}</label>}
        <div className="input-wrapper">
          {icon && <span className="input-icon">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`q-input ${icon ? 'has-icon' : ''} ${
              error ? 'is-invalid' : ''
            } ${className}`}
            {...props}
            aria-invalid={error ? true : props['aria-invalid']}
            aria-describedby={describedBy}
          />
        </div>
        {error && <span id={errorId} role="alert" className="input-error-msg">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
