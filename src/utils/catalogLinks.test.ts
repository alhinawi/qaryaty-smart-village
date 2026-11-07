import { describe, it, expect } from 'vitest';
import { catalogPath, catalogShareUrl, validCatalogId } from './catalogLinks';
import { shareDocument, escapeHtml } from '../../api/share';
describe('direct catalog sharing', () => {
  it('builds stable links without names, tokens or private data', () => {
    expect(catalogPath('shop', 12)).toBe('/shops/12');
    expect(catalogShareUrl('provider', 7, 'https://example.test')).toBe('https://example.test/share/provider/7');
    for (const id of [undefined, '0', '-1', '1.5', '2?x=1', '9007199254740992']) expect(validCatalogId(id)).toBe(false);
    expect(validCatalogId('123')).toBe(true);
  });
  it('delivers escaped per-record server metadata and a direct destination', () => {
    const html = shareDocument('shop', '12', '<img onerror="alert(1)">');
    expect(html).toContain('&lt;img onerror=&quot;alert(1)&quot;&gt;');
    expect(html).not.toContain('<img onerror');
    expect(html).toContain('location.replace("/shops/12")');
    expect(html).toContain('property="og:title"');
    expect(escapeHtml("a&'b")).toBe('a&amp;&#39;b');
    expect(shareDocument('provider', '2', 'اسم خيالي', true)).toContain('بيانات خيالية للتجربة');
  });
});
