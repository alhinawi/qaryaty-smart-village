import { describe, expect, it } from 'vitest';
import { createElement as h, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Input } from './Input';
import { Button } from './Button';

describe('shared form semantics', () => {
  it('uses distinct label associations for repeated labels', () => {
    const html = renderToStaticMarkup(h(Fragment, null, h(Input, {label:'الاسم'}),h(Input, {label:'الاسم'})));
    const ids = [...html.matchAll(/<input[^>]*id="([^"]+)"/g)].map(x => x[1]);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`for="${id}"`);
  });
  it('retains help text, associates errors and marks invalid input', () => {
    const html = renderToStaticMarkup(h(Input, {id:'phone',label:'الموبايل',error:'رقم مش صحيح','aria-describedby':'help'}));
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="help phone_error"');
    expect(html).toContain('id="phone_error" role="alert"');
  });
  it('marks loading and disables action without changing submit semantics', () => {
    const html = renderToStaticMarkup(h(Button,{type:'submit',loading:true},'دخول'));
    expect(html).toContain('type="submit"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
  });
});
