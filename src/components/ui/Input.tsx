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
    const inputId = id || (label ? `input_${label.replace(/\s+/g, '_')}` : undefined);

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
          />
        </div>
        {error && <span className="input-error-msg">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
