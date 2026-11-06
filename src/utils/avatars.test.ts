import { describe, expect, it } from 'vitest';
import { avatarUrl } from './avatars';
import { PROVIDERS } from '@/data/providers';

function params(url: string) {
  return new URL(url).searchParams;
}

describe('avatarUrl', () => {
  it('uses the avataaars style, which has a hijab', () => {
    expect(avatarUrl('x', 'female')).toContain('/avataaars/svg');
  });

  it('gives women a hijab with a closed neckline', () => {
    const p = params(avatarUrl('qaryaty-provider-1', 'female'));
    expect(p.get('top')).toBe('hijab');
    expect(p.get('clothing')).not.toContain('VNeck');
    expect(p.get('facialHairProbability')).toBe('0');
  });

  it('gives men short hair, never a hijab', () => {
    const top = params(avatarUrl('qaryaty-provider-2', 'male')).get('top') ?? '';
    expect(top).not.toContain('hijab');
    expect(top).toMatch(/short/);
  });

  it('is the same picture for the same seed', () => {
    expect(avatarUrl('a', 'male')).toBe(avatarUrl('a', 'male'));
  });

  it('every sample woman has a hijab', () => {
    const women = PROVIDERS.filter((p) => p.gender === 'female').map((p) => p.photo);
    expect(women.length).toBeGreaterThan(20);
    for (const photo of women) expect(photo).toMatch(/^\/img\/providers\/provider-\d+\.webp$/);
  });
});
