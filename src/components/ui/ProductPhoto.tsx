import { ImagePlaceholder } from './ImagePlaceholder';
// ─── Imports
import { useState } from 'react';

interface ProductPhotoProps {
  photo?: string;
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
  className = 'w-11 h-11 rounded-lg',
}: ProductPhotoProps) {
  const [failedPhoto, setFailedPhoto] = useState<string>();

  if (!photo || failedPhoto === photo) {
    return <ImagePlaceholder className={`${className} shrink-0`} />;
  }

  return (
    <img
      src={photo}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`${className} shrink-0 object-cover bg-gray-50`}
      onError={() => setFailedPhoto(photo)}
    />
  );
}
