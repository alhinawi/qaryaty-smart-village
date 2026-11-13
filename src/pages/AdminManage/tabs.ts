// ─── The dashboard's sections, in the order of the tab bar
export type AdminTab = 'overview' | 'orders' | 'users' | 'catalog' | 'villages' | 'donations' | 'coupons';

export const ADMIN_TABS: { id: AdminTab; label: string; emoji: string }[] = [
  { id: 'overview', label: 'الملخص', emoji: '📊' },
  { id: 'orders', label: 'الطلبات', emoji: '📦' },
  { id: 'users', label: 'المستخدمين', emoji: '👥' },
  { id: 'catalog', label: 'المحلات والخدمات', emoji: '🏪' },
  { id: 'villages', label: 'القرى', emoji: '🏘️' },
  { id: 'donations', label: 'باب الخير', emoji: '🤲' },
  { id: 'coupons', label: 'القسايم', emoji: '🎟️' },
];

/** Who opens /admin/manage: the owner and the general supervisor. The server checks every call with is_admin(). */
export function canUseManage(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function isAdminTab(v: string | null): v is AdminTab {
  return ADMIN_TABS.some((t) => t.id === v);
}
