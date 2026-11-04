import { describe, expect, it } from 'vitest';
import { DEVELOPER_LINKS, DEVELOPER_WHATSAPP } from './developer';

describe('developer contact links', () => {
  it('has LinkedIn, GitHub, Facebook and WhatsApp, once each', () => {
    expect(DEVELOPER_LINKS.map((l) => l.id).sort()).toEqual(['facebook', 'github', 'linkedin', 'whatsapp']);
  });

  it('uses absolute https links', () => {
    for (const link of DEVELOPER_LINKS) {
      expect(new URL(link.url).protocol).toBe('https:');
      expect(link.label.trim()).not.toBe('');
    }
  });

  it('opens WhatsApp with an international number (no + or leading 0)', () => {
    expect(DEVELOPER_WHATSAPP).toMatch(/^[1-9]\d{9,14}$/);
    expect(DEVELOPER_LINKS.find((l) => l.id === 'whatsapp')?.url).toBe(`https://wa.me/${DEVELOPER_WHATSAPP}`);
  });
});
