import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { ServiceCard } from './ServiceCard';
import { ShopCard } from './ShopCard';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';

beforeEach(() => vi.stubGlobal('window', { location: { origin: 'https://example.invalid' } }));
afterEach(() => vi.unstubAllGlobals());

it('service card actions are sibling native controls, not an interactive ancestor', () => {
  const html = renderToStaticMarkup(h(MemoryRouter,null,h(ServiceCard,{service:SERVICES[0],onSelect:()=>{}})));
  expect(html).not.toContain('role="button"');
  // عيش من الفرن is a shop: it opens the bakeries, never adds the whole service to the cart
  expect(html).toContain('aria-label="محلات عيش من الفرن"');
  expect(html).toContain('aria-label="تسوّق من محلات عيش من الفرن"');
  expect(html).not.toContain('للسلة');
  expect(html).toContain('aria-label="إضافة للمفضلة"');
  expect(html).toContain('aria-label="مشاركة عيش من الفرن"');
  expect(html).toContain('href="/services/1"');
});
it('a real service card still orders the service', () => {
  const plumber = SERVICES.find((s) => s.name === 'سباك')!;
  const html = renderToStaticMarkup(h(MemoryRouter,null,h(ServiceCard,{service:plumber,onSelect:()=>{}})));
  expect(html).toContain('aria-label="طلب خدمة سباك"');
  expect(html).not.toContain('تسوّق من محلات');
});
it('shop primary action is a native button independent of details/share', () => {
  const html = renderToStaticMarkup(h(MemoryRouter,null,h(ShopCard,{shop:SHOPS[0],onSelectShop:()=>{}})));
  expect(html).not.toContain('role="button"');
  expect(html).toContain(`aria-label="التسوق من ${SHOPS[0].name}"`);
  expect(html).toContain(`href="/shops/${SHOPS[0].id}"`);
});
