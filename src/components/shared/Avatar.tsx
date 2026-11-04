// ─── Profile photo with an initials fallback
import { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}

/** First letters of the first two words, skipping titles like أ. / د. */
export function initialsOf(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((w) => w && !/^(أ|د|م)\.?$/.test(w) && !w.endsWith('.'));
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join(' ');
}

export function Avatar({ src, name, size = 56, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (!src || failed) {
    return (
      <div
        style={style}
        className={`rounded-full bg-[#e8f5ee] text-green-dark font-black flex items-center justify-center shrink-0 ${className}`}
        role="img"
        aria-label={`صورة ${name}`}
      >
        <span className="text-[0.95em]" aria-hidden="true">
          {initialsOf(name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`صورة ${name}`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={style}
      className={`rounded-full object-cover bg-[#e8f5ee] shrink-0 ${className}`}
    />
  );
}
