// ─── إدارة قريتي (/admin/manage)
// The owner and the general supervisor only (the staff panel at /admin links here). The page hides itself from everyone else, but the real lock is
// on the server: every read and write here is checked with public.is_admin().
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router';
import { ROUTES } from '@/routes';
import { useAuthStore, selectRole } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Loading } from './ui';
import { ADMIN_TABS, canUseManage, isAdminTab, type AdminTab } from './tabs';

const OverviewTab = lazy(() => import('./OverviewTab'));
const OrdersTab = lazy(() => import('./OrdersTab'));
const UsersTab = lazy(() => import('./UsersTab'));
const CatalogTab = lazy(() => import('./CatalogTab'));
const VillagesTab = lazy(() => import('./VillagesTab'));
const DonationsTab = lazy(() => import('./DonationsTab'));
const CouponsTab = lazy(() => import('./CouponsTab'));

export default function AdminPage() {
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore(selectRole);
  const isAdmin = canUseManage(role);
  const showToast = useUIStore((s) => s.showToast);
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  // The saved session can be older than a role change: ask the server once before turning someone away.
  const [checked, setChecked] = useState(isAdmin || !session);

  useEffect(() => {
    if (checked) return;
    let alive = true;
    useAuthStore
      .getState()
      .refresh()
      .catch(() => undefined)
      .finally(() => alive && setChecked(true));
    return () => {
      alive = false;
    };
  }, [checked]);

  const notAdmin = checked && !!session && !isAdmin;
  useEffect(() => {
    if (notAdmin) showToast('الصفحة دي للمالك والمشرف العام بس');
  }, [notAdmin, showToast]);

  if (!session) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  if (!checked) return <Loading />;
  if (!isAdmin) return <Navigate to={ROUTES.admin} replace />;

  const raw = params.get('tab');
  const tab: AdminTab = isAdminTab(raw) ? raw : 'overview';
  const go = (t: AdminTab) => {
    const next = new URLSearchParams();
    if (t !== 'overview') next.set('tab', t);
    setParams(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 pt-4 pb-24" dir="rtl">
      <Link to={ROUTES.admin} className="inline-block text-[13px] font-bold text-green no-underline mb-1">
        رجوع للوحة التحكم
      </Link>
      <h1 className="text-[clamp(1.3rem,4.5vw,1.7rem)] font-black text-green-dark m-0">🛠️ إدارة قريتي</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-3">
        أهلاً {session.user.name.split(' ')[0]}، ده كل اللي محتاجه علشان تدير قريتي.
      </p>

      <nav
        aria-label="أقسام لوحة التحكم"
        className="sticky top-[var(--header-h,56px)] z-10 -mx-4 px-4 py-2 bg-cream/95 backdrop-blur flex gap-2 overflow-x-auto [scrollbar-width:none]"
      >
        {ADMIN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => go(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`shrink-0 min-h-[40px] px-4 rounded-full text-[13px] font-extrabold border cursor-pointer font-['Cairo',sans-serif] ${
              tab === t.id ? 'bg-green text-white border-green' : 'bg-white text-green-dark border-green/30'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </nav>

      <Suspense fallback={<Loading />}>
        {tab === 'overview' && <OverviewTab onOpen={go} />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'catalog' && <CatalogTab />}
        {tab === 'villages' && <VillagesTab />}
        {tab === 'donations' && <DonationsTab />}
        {tab === 'coupons' && <CouponsTab />}
      </Suspense>
    </div>
  );
}
