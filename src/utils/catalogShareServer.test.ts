import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/share';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('public metadata privacy and demo gates', () => {
  it('accepts the original share path as well as rewritten query parameters', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const response = await handler(new Request('https://example.test/share/shop/12'));
    expect(response.status).toBe(200); expect(await response.text()).toContain('location.replace("/shops/12")');
  });
  it('rejects invalid identifiers before any query', async () => {
    const response = await handler(new Request('https://example.test/api/share?kind=admin&id=1'));
    expect(response.status).toBe(404);
  });
  it('serves generic metadata when the catalog cannot be verified', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://database.test'); vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    const response = await handler(new Request('https://example.test/api/share?kind=shop&id=1&name=private-name'));
    const html = await response.text();
    expect(html).not.toContain('private-name'); expect(html).toContain('اكتشف محلات وخدمات قريتي'); expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('filters demo and inactive rows before using public metadata', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://database.test'); vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('[{"value":0}]')).mockResolvedValueOnce(new Response('[{"name":"دكتور مسجل","is_demo":false}]'));
    vi.stubGlobal('fetch', fetcher);
    const response = await handler(new Request('https://example.test/api/share?kind=provider&id=12'));
    expect(fetcher.mock.calls[1][0]).toContain('active=eq.true&is_demo=eq.false');
    expect(await response.text()).toContain('دكتور مسجل | قريتي');
  });
});
