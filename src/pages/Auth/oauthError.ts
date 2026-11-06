// ─── The error Google or Supabase puts in the address bar after the redirect
/** The error Google or Supabase put in the address bar, in Arabic, or '' when none. */
export function oauthErrorFrom(search: string, hash: string): string {
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  const code = params.get('error') ?? hashParams.get('error');
  if (!code) return '';
  const description = params.get('error_description') ?? hashParams.get('error_description') ?? '';
  if (code === 'access_denied') return 'لغيت التسجيل عبر جوجل. تقدر تجرب تاني أو تسجّل بالإيميل';
  if (/provider is not enabled|unsupported provider/i.test(description)) {
    return 'التسجيل عبر جوجل لسه مش متاح، سجّل بالإيميل دلوقتي';
  }
  return 'ماقدرناش ندخّلك بجوجل دلوقتي. جرّب تاني بعد شوية أو سجّل بالإيميل';
}
