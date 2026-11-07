// Public metadata only. No service-role credentials, private records, or supplied names.
export const config = { runtime: 'edge' };
const SITE = 'https://qaryaty.vercel.app';
export function escapeHtml(value: string) { return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!); }
export function shareDocument(kind: string, id: string, name?: string, demo = false) {
  const path = `/${kind}s/${id}`;
  const title = name ? `${name}${demo ? ' (عرض تجريبي)' : ''} | قريتي` : 'اكتشف محلات وخدمات قريتي';
  const description = demo ? 'بيانات خيالية للتجربة، مش محل أو مزود خدمة حقيقي.' : 'افتح التفاصيل والمنتجات أو الخدمات المتاحة على قريتي.';
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${description}"><meta property="og:image" content="${SITE}/og-qaryati-pocket-changa-clean-20261107.jpg"><meta property="og:url" content="${SITE}/share/${kind}/${id}"><meta name="twitter:card" content="summary_large_image"><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}${path}"></head><body><h1>${escapeHtml(title)}</h1><p>${description}</p><a href="${path}">افتح الصفحة على قريتي</a><script>location.replace(${JSON.stringify(path)})</script></body></html>`;
}
export default async function handler(request: Request) {
  const url = new URL(request.url);
  const route = url.pathname.match(/^\/share\/(shop|provider|service)\/([1-9]\d*)$/);
  const kind = route?.[1] ?? url.searchParams.get('kind') ?? '', id = route?.[2] ?? url.searchParams.get('id') ?? '';
  if (!['shop', 'provider', 'service'].includes(kind) || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return new Response('Not found', { status: 404 });
  let name: string | undefined, demo = false;
  const base = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
  if (base && key) try {
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    const setting = await fetch(`${base}/rest/v1/app_settings?select=value&key=eq.demo_mode`, { headers, signal: AbortSignal.timeout(2500) });
    if (!setting.ok) throw Error('setting unavailable');
    const settings = await setting.json() as {value:number}[];
    const showDemo = settings.length === 0 || Number(settings[0].value) === 1;
    const filter = kind === 'provider' ? '&active=eq.true' : kind === 'service' ? '&hidden=eq.false' : '';
    const response = await fetch(`${base}/rest/v1/${kind}s?select=name,is_demo&id=eq.${id}${filter}${showDemo ? '' : '&is_demo=eq.false'}&limit=1`, { headers, signal: AbortSignal.timeout(2500) });
    if (response.ok) {
      const rows = await response.json() as {name:string;is_demo:boolean}[];
      if (rows[0]?.name) { name = rows[0].name; demo = rows[0].is_demo; }
    }
  } catch { /* Generic metadata if the public catalog cannot be verified. Never use seeded fallbacks. */ }
  return new Response(shareDocument(kind, id, name, demo), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
