import { describe, expect, it } from 'vitest';
import { WHATSAPP_COMMUNITY, WHATSAPP_GROUPS, isWhatsAppInviteLink } from './whatsappGroups';

describe('WhatsApp groups config', () => {
  it('has unique ids and a name and description for every group', () => {
    const ids = WHATSAPP_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const group of WHATSAPP_GROUPS) {
      expect(group.id).toMatch(/^[a-z-]+$/);
      expect(group.name.trim()).not.toBe('');
      expect(group.description.trim()).not.toBe('');
    }
  });

  it('every filled-in link is a real WhatsApp invite link', () => {
    for (const url of [WHATSAPP_COMMUNITY.url, ...WHATSAPP_GROUPS.map((g) => g.url)]) {
      if (url !== '') expect(isWhatsAppInviteLink(url)).toBe(true);
    }
  });
});

describe('isWhatsAppInviteLink', () => {
  it('accepts group invite links', () => {
    expect(isWhatsAppInviteLink('https://chat.whatsapp.com/AbCdEf1234567890')).toBe(true);
    expect(isWhatsAppInviteLink('https://chat.whatsapp.com/AbCdEf1234567890/')).toBe(true);
  });

  it('rejects other links and empty values', () => {
    expect(isWhatsAppInviteLink('')).toBe(false);
    expect(isWhatsAppInviteLink('http://chat.whatsapp.com/AbCdEf1234567890')).toBe(false);
    expect(isWhatsAppInviteLink('https://wa.me/201028928248')).toBe(false);
    expect(isWhatsAppInviteLink('https://chat.whatsapp.com/')).toBe(false);
    expect(isWhatsAppInviteLink('https://evil.com/chat.whatsapp.com/AbCdEf1234567890')).toBe(false);
  });
});
