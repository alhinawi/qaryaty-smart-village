import { describe, expect, it } from 'vitest';
import { mobileMenuSections } from './mobileMenu';
import { ROUTES } from '@/routes';

const allLinks = (isAdmin: boolean) => mobileMenuSections({ isAdmin }).flatMap((s) => s.links);

describe('mobile menu', () => {
  it('has messages, jobs, About, WhatsApp groups, donations and advertise for everyone', () => {
    expect(allLinks(false).map((l) => l.id)).toEqual(['messages', 'jobs', 'about', 'groups', 'donate', 'advertise']);
  });

  it('shows the admin panel to admins only', () => {
    expect(allLinks(false).some((l) => l.to === ROUTES.admin)).toBe(false);
    expect(allLinks(true).at(-1)?.to).toBe(ROUTES.admin);
    expect(allLinks(false).some((l) => l.to === ROUTES.jobsReview)).toBe(false);
    expect(allLinks(true).some((l) => l.to === ROUTES.jobsReview)).toBe(true);
  });

  it('points only at routes the app has', () => {
    const known = new Set<string>(Object.values(ROUTES));
    for (const link of allLinks(true)) {
      expect(known.has(link.to.split('#')[0])).toBe(true);
      expect(link.label.trim()).not.toBe('');
    }
  });

  it('has no login link (sign in stays on the profile page)', () => {
    const paths = allLinks(true).map((l) => l.to);
    expect(paths).not.toContain(ROUTES.login);
    expect(paths).not.toContain(ROUTES.register);
  });
});
