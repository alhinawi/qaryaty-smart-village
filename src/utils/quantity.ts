// ─── Quantities in the cart: quick choices per unit, typed numbers, and how they read
import { toArabicDigits } from './arabicNumbers';

/** The most of one line the server accepts (the orders trigger checks qty <= 100). */
export const MAX_LINE_QUANTITY = 100;

/** Rounds to the item's step (halves for kilos) and keeps it between one step and the maximum. */
export function clampQuantity(quantity: number, step = 1): number {
  const s = step > 0 ? step : 1;
  const rounded = Math.round(quantity / s) * s;
  const max = Math.floor(MAX_LINE_QUANTITY / s) * s;
  return Math.min(Math.max(rounded, s), max);
}

/** Units counted in loaves: people buy bread by the 5s and 10s. */
const BREAD = /رغيف|عيش/;
/** Medicine packs and big items: rarely more than a few. */
const FEW = /قرص|كبسول|زجاجة|أنبوبة|امبول|أمبول|فيال|لبوس|بخة|شرنك|سرنج|شريط|حفاض|جهاز|طقم|كرتونة|تورتة|بطة|وزة|فرخة|قلم/;

/**
 * Quick choices for an item, by its unit: loaves 5, 10, 20, 25, 50; kilos in halves
 * (½, 1, 2, 3, 5); quarter-kilos 1, 2, 4 (a kilo), 8; medicine and big items 1, 2, 3;
 * anything else 1, 2, 3, 5, 10.
 */
export function quickQuantities(unit: string | undefined, step = 1): number[] {
  const u = unit ?? '';
  let choices: number[];
  if (step < 1) choices = [0.5, 1, 2, 3, 5];
  else if (BREAD.test(u)) choices = [5, 10, 20, 25, 50];
  else if (u === 'ربع كيلو') choices = [1, 2, 4, 8];
  else if (FEW.test(u)) choices = [1, 2, 3];
  else choices = [1, 2, 3, 5, 10];
  // Only what the step allows (no ½ for whole units), within the limit
  return choices.filter((q) => q <= MAX_LINE_QUANTITY && Math.abs(q / step - Math.round(q / step)) < 1e-9);
}

/** "نص", "١ ونص", "٣": how a quantity reads, in Arabic digits. */
export function formatQuantityNumber(quantity: number): string {
  const whole = Math.floor(quantity + 1e-9);
  const half = Math.abs(quantity - whole - 0.5) < 1e-9;
  if (half) return whole === 0 ? 'نص' : `${toArabicDigits(whole)} ونص`;
  if (Number.isInteger(quantity)) return toArabicDigits(quantity);
  return quantity.toLocaleString('ar-EG');
}

/** "١٠ رغيف", "نص كيلو". */
export function formatQuantity(quantity: number, unit?: string): string {
  const n = formatQuantityNumber(quantity);
  return unit ? `${n} ${unit}` : n;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * A number the customer typed, in Arabic or English digits, with ٫ , or . for a fraction,
 * or "نص" / "ونص". null when it isn't a number above zero.
 */
export function parseQuantity(text: string): number | null {
  let t = text.trim();
  if (!t) return null;
  t = t
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٫,،]/g, '.')
    .replace(/\s+/g, ' ');
  if (/^(نص|نصف|½)$/.test(t)) return 0.5;
  const withHalf = t.match(/^(\d+)\s*(?:و\s*نص|و\s*نصف|½)$/);
  if (withHalf) return Number(withHalf[1]) + 0.5;
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}
