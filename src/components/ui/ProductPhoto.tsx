import { SERVICE_IMAGES } from '@/config/serviceImages';
// ─── Imports
import { useState } from 'react';

interface ProductPhotoProps {
  photo?: string;
  fallbackPhoto?: string;
  emoji: string;
  /** Tailwind size and shape classes for the box. */
  className?: string;
  /** Legacy compatibility only; missing photos always use a neutral icon. */
  emojiClassName?: string;
}

// ─── Component
/** The product photo, or a neutral placeholder when missing or broken. */
export function ProductPhoto({
  photo,
  fallbackPhoto,
  emoji,
  className = 'w-11 h-11 rounded-lg',
}: ProductPhotoProps) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const category = ({ '🐟': 2, '🥖': 1, '🛵': 3, '🥬': 9, '🥩': 32, '👔': 31, '🍳': 13 } as Record<string, number>)[emoji];
  const source = [photo, fallbackPhoto, category ? SERVICE_IMAGES[category] : undefined].find(src => src && !failed[src]);
  if (!source) return <span aria-hidden="true" className={`${className} shrink-0 bg-cream flex items-center justify-center text-xl`}>{emoji || '🛍️'}</span>;

  return (
    <img
      src={source}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`${className} shrink-0 object-cover bg-gray-50`}
      onError={() => setFailed(value => ({ ...value, [source]: true }))}
    />
  );
}
