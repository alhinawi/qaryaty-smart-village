// ─── A photo of people from /public/img/people, responsive (srcset) and lazy by default
import { PEOPLE_PHOTOS, peoplePhotoSrc, peoplePhotoSrcSet, type PeoplePhotoId } from '@/data/peoplePhotos';

interface PeoplePhotoProps {
  id: PeoplePhotoId;
  /** The width the image takes on screen, for the browser to pick the right file. */
  sizes: string;
  className?: string;
  /** Above the fold: load right away instead of lazily. */
  priority?: boolean;
}

export function PeoplePhoto({ id, sizes, className = '', priority = false }: PeoplePhotoProps) {
  const photo = PEOPLE_PHOTOS[id];
  const width = photo.widths[0];
  const height = Math.round((width * photo.ratio[1]) / photo.ratio[0]);

  return (
    <img
      src={peoplePhotoSrc(id, width)}
      srcSet={peoplePhotoSrcSet(id)}
      sizes={sizes}
      width={width}
      height={height}
      alt={photo.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={`object-cover bg-cream ${className}`}
    />
  );
}
