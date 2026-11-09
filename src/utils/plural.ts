/**
 * Egyptian Arabic counted-noun agreement. One shared helper so every
 * «رقم + اسم» in the app follows the same rule and can't regress:
 *   1     → the singular form alone («سنة»)
 *   2     → the dual form («سنتين»)
 *   3-10  → the plural form («سنين»)
 *   11+   → back to the singular («16 سنة», «100 سنة»)
 * Usage: `${n} ${counted(n, 'سنة', 'سنتين', 'سنين')}`
 */
export function counted(n: number, one: string, two: string, few: string): string {
  const abs = Math.abs(n);
  if (abs === 2) return two;
  if (abs >= 3 && abs <= 10) return few;
  return one;
}
