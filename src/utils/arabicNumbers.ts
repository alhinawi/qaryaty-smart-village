// ─── Numbers in Arabic-Indic digits (٣ not 3) for short notes like "فاضل ٣"
const DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toArabicDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => DIGITS[Number(d)]);
}
