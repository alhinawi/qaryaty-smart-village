// ─── Imports
import React from 'react';

// ─── Component
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="w-[min(100%-1.5rem,1200px)] md:w-[min(100%-3rem,1200px)] mx-auto py-4 md:py-6">{children}</div>;
}
