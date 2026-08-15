// ─── Imports
import React from 'react';

// ─── Component
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="page-wrapper">{children}</div>;
}
