import { ImageOff } from 'lucide-react';

/** Quiet, non-pictorial fallback. Never substitute a food/service emoji for a photo. */
export function ImagePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div role="img" aria-label="الصورة غير متاحة" className={`flex items-center justify-center bg-stone-100 text-stone-400 ${className}`}>
      <ImageOff size={22} strokeWidth={1.4} aria-hidden="true" />
    </div>
  );
}
