// ─── Photo uploads from the provider/admin panels (preview)
// Until the shop-images storage bucket ships (see the provider-accounts
// migration), a picked photo is downscaled on the device and kept as a data
// URL inside the dashboard store.

const MAX_EDGE = 900;
const JPEG_QUALITY = 0.85;

export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';
export const IMAGE_TYPE_MESSAGE = 'اختار صورة من النوع JPG أو PNG أو WebP';

/** Reads a picked image file, downscales it and returns a compact data URL. */
export async function fileToDataUrl(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error(IMAGE_TYPE_MESSAGE);
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ماقدرناش نجهّز الصورة على الجهاز ده');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
