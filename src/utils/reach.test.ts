import { describe, expect, it } from 'vitest';
import type { Provider, ProviderMode } from '@/types';
import { DEVELOPER_TEACHER_IDS, PROVIDERS } from '@/data/providers';
import { DEFAULT_VILLAGE, VILLAGES, knownVillage, nearbyVillages } from '@/data/villages';
import { isLocalProvider, localProviders, onlineProviders, villagesInReach, worksInPerson } from './reach';

function teacher(village: string, modes: ProviderMode[]): Provider {
  return { ...PROVIDERS.find((p) => p.kind === 'teacher')!, village, modes };
}

const own = { village: 'منية سندوب', includeNearby: false };
const withNearby = { village: 'منية سندوب', includeNearby: true };

describe('villages', () => {
  it('starts in منية سندوب', () => {
    expect(DEFAULT_VILLAGE).toBe('منية سندوب');
    expect(VILLAGES[0]).toBe('منية سندوب');
  });

  it('neighbours go both ways', () => {
    expect(nearbyVillages('منية سندوب')).toContain('بدواي');
    expect(nearbyVillages('بدواي')).toContain('منية سندوب');
    expect(nearbyVillages('منية سندوب')).not.toContain('تلبانة');
  });

  it.each([
    ['منية سندوب - الدقهلية', 'منية سندوب'],
    ['منيه سندوب', 'منية سندوب'],
    ['منية بدواي', 'منية بدواي'],
    ['بدواي، المنصورة', 'بدواي'],
    ['قرية البركة - الجيزة', null],
    ['', null],
  ])('knownVillage(%s) → %s', (typed, expected) => {
    expect(knownVillage(typed)).toBe(expected);
  });
});

describe('reach', () => {
  it('own village only, unless nearby is on', () => {
    expect(villagesInReach(own)).toEqual(new Set(['منية سندوب']));
    expect(villagesInReach(withNearby).has('ميت خميس')).toBe(true);
  });

  it('an in-person teacher shows in their village, and nearby only with the toggle', () => {
    expect(isLocalProvider(teacher('منية سندوب', ['teacher_home']), own)).toBe(true);
    expect(isLocalProvider(teacher('بدواي', ['center']), own)).toBe(false);
    expect(isLocalProvider(teacher('بدواي', ['center']), withNearby)).toBe(true);
  });

  it('a far teacher who teaches only in person never shows', () => {
    const far = teacher('تلبانة', ['teacher_home']);
    expect(isLocalProvider(far, withNearby)).toBe(false);
    expect(onlineProviders([far])).toEqual([]);
  });

  it('online teachers show in the online tab from anywhere, not in the village list', () => {
    const cairo = teacher('القاهرة', ['online']);
    expect(isLocalProvider(cairo, withNearby)).toBe(false);
    expect(onlineProviders([cairo])).toEqual([cairo]);
  });

  it('a village teacher who also teaches online is in both', () => {
    const both = teacher('منية سندوب', ['home', 'online']);
    expect(localProviders([both], own)).toEqual([both]);
    expect(onlineProviders([both])).toEqual([both]);
  });
});

describe('sample data', () => {
  it('every sample provider has a village, most in منية سندوب', () => {
    // The developer's own cards are online-only, with no village given yet
    expect(PROVIDERS.every((p) => p.village || (DEVELOPER_TEACHER_IDS as readonly number[]).includes(p.id))).toBe(true);
    const home = PROVIDERS.filter((p) => p.village === 'منية سندوب').length;
    expect(home / PROVIDERS.length).toBeGreaterThan(0.5);
  });

  it('about 90% of teachers are from منية سندوب, the rest from ميت خميس', () => {
    // The developer's own cards carry no made-up village; the 90% rule is for the sample teachers.
    const teachers = PROVIDERS.filter((p) => p.kind === 'teacher' && !(DEVELOPER_TEACHER_IDS as readonly number[]).includes(p.id));
    const home = teachers.filter((p) => p.village === 'منية سندوب').length;
    expect(home / teachers.length).toBeGreaterThanOrEqual(0.85);
    expect(teachers.every((p) => p.village === 'منية سندوب' || p.village === 'ميت خميس')).toBe(true);
  });

  it('online and in-person modes both still exist among teachers', () => {
    const teachers = PROVIDERS.filter((p) => p.kind === 'teacher');
    expect(teachers.some((p) => !worksInPerson(p))).toBe(true);
    expect(teachers.some((p) => worksInPerson(p))).toBe(true);
  });
});
