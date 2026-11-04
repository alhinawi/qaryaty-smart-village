// ─── Imports
import { useState } from 'react';

interface ProductPhotoProps {
  photo?: string;
  emoji: string;
  /** Tailwind size and shape classes for the box. */
  className?: string;
  /** Emoji size when there is no photo. */
  emojiClassName?: string;
}

// ─── Component
/** The product's photo, or its emoji when it has none or the photo fails to load. */
export function ProductPhoto({
  photo,
  emoji,
  className = 'w-11 h-11 rounded-lg',
  emojiClassName = 'text-[28px]',
}: ProductPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!photo || failed) {
    return (
      <div className={`${className} shrink-0 flex items-center justify-center bg-gray-50 ${emojiClassName}`}>
        <span role="img" aria-hidden="true">
          {emoji}
        </span>
      </div>
    );
  }

  return (
    <img
      src={photo}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`${className} shrink-0 object-cover bg-gray-50`}
      onError={() => setFailed(true)}
    />
  );
}
