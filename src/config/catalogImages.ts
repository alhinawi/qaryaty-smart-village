import type { Product } from '@/types';
import manifest from './catalogImageManifest.json';

const images: Record<string, { name: string; originalPhoto?: string; photo: string }> = manifest;

/** Original illustrative photos for known demo items. Real merchant uploads win. */
export function catalogProductPhoto(scope: string, product: Product): Product {
  const image = images[`${scope}|${product.id}`];
  const oldDemoPhoto = !product.photo || product.photo === image?.originalPhoto;
  return image && image.name === product.name && oldDemoPhoto
    ? { ...product, photo: image.photo }
    : product;
}
