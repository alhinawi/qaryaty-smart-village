// ─── Shrink a phone photo before upload: longest side 1280px, JPEG ~75%.
// A 4 MB camera photo becomes ~150–300 KB, so posting works on a weak connection.

export const MAX_PHOTO_SIDE = 1280;
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;

/** New width/height that fit inside `max` on the longest side (never upscales). */
export function fitInside(width: number, height: number, max = MAX_PHOTO_SIDE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export class ImageError extends Error {}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('الملف ده مش صورة نقدر نفتحها، جرّب صورة تانية'));
    };
    img.src = url;
  });
}

export async function compressImage(file: File, quality = 0.75): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new ImageError('اختار صورة بس');
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('الصورة كبيرة أوي، اختار صورة أصغر');
  const img = await loadImage(file);
  const { width, height } = fitInside(img.naturalWidth, img.naturalHeight);
  if (!width || !height) throw new ImageError('الصورة دي فاضية، جرّب صورة تانية');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('المتصفح مش قادر يجهّز الصورة');
  // White behind transparent PNGs (JPEG has no transparency)
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new ImageError('المتصفح مش قادر يجهّز الصورة');
  return blob;
}
