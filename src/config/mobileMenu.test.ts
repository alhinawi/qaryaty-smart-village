import { describe, expect, it } from 'vitest';
import { mobileMenuSections } from './mobileMenu';
import { ROUTES } from '@/routes';
import type { UserRole } from '@/types';

const allLinks = (role: UserRole | undefined) => mobileMenuSections({ role }).flatMap((s) => s.links);

describe('mobile menu', () => {
  it('has messages, jobs, used-goods market, ride sharing, About, WhatsApp groups, donations and advertise for everyone', () => {
    expect(allLinks(undefined).map((l) => l.id)).toEqual(['assistant', 'messages', 'jobs', 'marketSale', 'rides', 'about', 'groups', 'donate', 'advertise']);
    expect(allLinks('customer').map((l) => l.id)).toEqual(['assistant', 'messages', 'jobs', 'marketSale', 'rides', 'about', 'groups', 'donate', 'advertise']);
  });

  it('hides the whole staff section from customers and signed-out visitors', () => {
    for (const role of [undefined, 'customer'] as const) {
      const paths = allLinks(role).map((l) => l.to);
      expect(paths).not.toContain(ROUTES.admin);
      expect(paths).not.toContain(ROUTES.dashboard);
      expect(paths).not.toContain(ROUTES.jobsReview);
      expect(paths).not.toContain(ROUTES.marketReview);
      expect(paths).not.toContain(ROUTES.ridesReview);
    }
  });

  it('gives the owner and the general supervisor every staff link', () => {
    for (const role of ['owner', 'admin'] as const) {
      const ids = allLinks(role).map((l) => l.id);
      for (const id of ['jobsReview', 'marketReview', 'ridesReview', 'dashboard', 'admin']) {
        expect(ids).toContain(id);
      }
    }
  });

  it('gives the content supervisor the review queues only', () => {
    const ids = allLinks('content_admin').map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(['jobsReview', 'marketReview', 'ridesReview', 'admin']));
    expect(ids).not.toContain('dashboard');
  });

  it('gives the orders supervisor the provider dashboard, not the review queues', () => {
    const ids = allLinks('orders_admin').map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(['dashboard', 'admin']));
    expect(ids).not.toContain('jobsReview');
    expect(ids).not.toContain('marketReview');
    expect(ids).not.toContain('ridesReview');
  });

  it('points only at routes the app has', () => {
    const known = new Set<string>(Object.values(ROUTES));
    for (const link of allLinks('owner')) {
      expect(known.has(link.to.split('#')[0])).toBe(true);
      expect(link.label.trim()).not.toBe('');
    }
  });

  it('has no login link (sign in stays on the profile page)', () => {
    const paths = allLinks('owner').map((l) => l.to);
    expect(paths).not.toContain(ROUTES.login);
    expect(paths).not.toContain(ROUTES.register);
  });
});
