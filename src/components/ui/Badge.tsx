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
  const baseClasses = "inline-block px-[0.6rem] py-[0.2rem] rounded-xl text-xs font-extrabold";
  const variantClasses = {
    popular: "bg-[#fef3c7] text-[#b45309]",
    new: "bg-blue-100 text-blue-800", // Fallback for missing 'new' variant
    warning: "bg-[#fffbeb] text-[#d97706]",
    info: "bg-[#eff6ff] text-[#2563eb]",
    success: "bg-[#dcfce7] text-success",
    danger: "bg-[#fee2e2] text-danger"
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
