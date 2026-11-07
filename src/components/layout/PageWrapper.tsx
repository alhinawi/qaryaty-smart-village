// ─── Imports
import React, { useRef } from 'react';
import { useMotion } from '@/hooks/useMotion';

// ─── Component
export function PageWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref);
  return <div ref={ref} className="w-[min(100%-1.5rem,1200px)] md:w-[min(100%-3rem,1200px)] mx-auto py-4 md:py-6">{children}</div>;
}
