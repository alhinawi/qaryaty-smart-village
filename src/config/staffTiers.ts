// ─── Staff tiers (درجات المشرفين)
// Modeled on how the big delivery/marketplace apps structure their portals
// (Uber Eats Manager: Admin/Manager/Staff; DoorDash Merchant Portal:
// Business Admin/Store Manager/Store Operator), mapped to Qaryati's scale:
// one owner with full control, a general supervisor, and two focused tiers.

import type { UserRole } from '@/types';

export type StaffRole = Exclude<UserRole, 'customer'>;

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'المالك',
  admin: 'مشرف عام',
  content_admin: 'مشرف المراجعة والبلاغات',
  orders_admin: 'مشرف الطلبات والمحلات',
};

/** One-line description shown when appointing someone. */
export const STAFF_ROLE_HINTS: Record<StaffRole, string> = {
  owner: 'كل الصلاحيات، والوحيد اللي بيعيّن المشرفين ويغيّر درجاتهم',
  admin: 'كل أقسام الإدارة، ما عدا تعيين المشرفين والإعدادات المالية',
  content_admin: 'طوابير المراجعة: الوظائف وبلاغات المستعمل والمواصلات',
  orders_admin: 'المحلات ومقدمي الخدمة والطلبات من لوحة مقدم الخدمة',
};

/** Tiers the owner can appoint from the app. The owner role itself never changes from the app. */
export const APPOINTABLE_ROLES: StaffRole[] = ['admin', 'content_admin', 'orders_admin'];

export const isStaffRole = (role: UserRole | null | undefined): role is StaffRole =>
  role === 'owner' || role === 'admin' || role === 'content_admin' || role === 'orders_admin';

/** Review queues: jobs, market and ride reports (and the reported-content blocks on detail pages). */
export const canReviewContent = (role: UserRole | null | undefined): boolean =>
  role === 'owner' || role === 'admin' || role === 'content_admin';

/** Provider dashboard, shops/providers and orders follow-up. */
export const canManageProviders = (role: UserRole | null | undefined): boolean =>
  role === 'owner' || role === 'admin' || role === 'orders_admin';

/** Appointing supervisors and changing their tiers: the owner only. */
export const canManageSupervisors = (role: UserRole | null | undefined): boolean => role === 'owner';

/** Which /admin sections a tier sees. */
export interface AdminSections {
  overview: boolean;
  reviewQueues: boolean;
  providerDashboard: boolean;
  supervisors: boolean;
  feesNote: boolean;
}

export const adminSectionsFor = (role: UserRole | null | undefined): AdminSections => ({
  overview: isStaffRole(role),
  reviewQueues: canReviewContent(role),
  providerDashboard: canManageProviders(role),
  supervisors: canManageSupervisors(role),
  feesNote: canManageSupervisors(role),
});
