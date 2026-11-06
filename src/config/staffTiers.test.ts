import { describe, expect, it } from 'vitest';
import {
  APPOINTABLE_ROLES,
  STAFF_ROLE_HINTS,
  STAFF_ROLE_LABELS,
  adminSectionsFor,
  canManageProviders,
  canManageSupervisors,
  canReviewContent,
  isStaffRole,
} from './staffTiers';
import type { UserRole } from '@/types';

const EVERY_ROLE: UserRole[] = ['customer', 'orders_admin', 'content_admin', 'admin', 'owner'];

describe('staff tiers', () => {
  it('labels and hints cover every appointable tier and the owner, never the customer', () => {
    for (const role of ['owner' as const, ...APPOINTABLE_ROLES]) {
      expect(STAFF_ROLE_LABELS[role].trim()).not.toBe('');
      expect(STAFF_ROLE_HINTS[role].trim()).not.toBe('');
    }
    expect(APPOINTABLE_ROLES).not.toContain('owner');
    expect(APPOINTABLE_ROLES).toEqual(['admin', 'content_admin', 'orders_admin']);
  });

  it('only staff roles open the staff surfaces', () => {
    expect(EVERY_ROLE.filter(isStaffRole)).toEqual(['orders_admin', 'content_admin', 'admin', 'owner']);
    expect(isStaffRole('customer')).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });

  it('review queues are for the content supervisor and up', () => {
    expect(EVERY_ROLE.filter(canReviewContent)).toEqual(['content_admin', 'admin', 'owner']);
  });

  it('the provider dashboard is for the orders supervisor and up', () => {
    expect(EVERY_ROLE.filter(canManageProviders)).toEqual(['orders_admin', 'admin', 'owner']);
  });

  it('appointing supervisors is the owner only', () => {
    expect(EVERY_ROLE.filter(canManageSupervisors)).toEqual(['owner']);
  });

  it('maps every tier to its /admin sections', () => {
    expect(adminSectionsFor('customer').overview).toBe(false);
    expect(adminSectionsFor('content_admin')).toEqual({
      overview: true,
      reviewQueues: true,
      providerDashboard: false,
      supervisors: false,
      feesNote: false,
    });
    expect(adminSectionsFor('orders_admin')).toEqual({
      overview: true,
      reviewQueues: false,
      providerDashboard: true,
      supervisors: false,
      feesNote: false,
    });
    expect(adminSectionsFor('admin')).toEqual({
      overview: true,
      reviewQueues: true,
      providerDashboard: true,
      supervisors: false,
      feesNote: false,
    });
    expect(adminSectionsFor('owner')).toEqual({
      overview: true,
      reviewQueues: true,
      providerDashboard: true,
      supervisors: true,
      feesNote: true,
    });
  });
});
