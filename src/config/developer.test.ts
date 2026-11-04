import { describe, expect, it } from 'vitest';
import {
  ADVERTISE_MESSAGE,
  DEVELOPER_LINKS,
  DEVELOPER_PHONE_LINK,
  DEVELOPER_WHATSAPP,
  whatsappChatLink,
} from './developer';

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

  it('puts the advertiser message in the WhatsApp link, encoded', () => {
    const url = new URL(whatsappChatLink(ADVERTISE_MESSAGE));
    expect(url.origin + url.pathname).toBe(`https://wa.me/${DEVELOPER_WHATSAPP}`);
    expect(url.searchParams.get('text')).toBe(ADVERTISE_MESSAGE);
  });

  it('calls the same number', () => {
    expect(DEVELOPER_PHONE_LINK).toBe(`tel:+${DEVELOPER_WHATSAPP}`);
  });
});
