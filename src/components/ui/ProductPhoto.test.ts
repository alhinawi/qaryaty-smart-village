import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ProductPhoto } from './ProductPhoto';

describe('product thumbnail fallbacks', () => {
  it('resolves a category photo when the item has no photo', () => {
    const html = renderToStaticMarkup(createElement(ProductPhoto, { emoji: '🥖' }));
    expect(html).toContain('/img/services/food.webp');
    expect(html).not.toContain('🥖');
  });
  it('retains the supplied merchant photo', () => {
    const html = renderToStaticMarkup(createElement(ProductPhoto, { emoji: '🥖', photo: '/merchant.webp' }));
    expect(html).toContain('src="/merchant.webp"');
    expect(html).not.toContain('الصورة غير متاحة');
  });
});
