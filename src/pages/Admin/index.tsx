// ─── Owner panel (/admin): the platform owner's home. Review queues live on
// their own pages (jobs, market, rides); this page gathers them with a quick
// overview. Admins only, like the review pages.
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { ROUTES } from '@/routes';
import { jobRepo, marketRepo, rideRepo } from '@/repositories';
import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { isProviderDashboardEnabled } from '@/config/providerDashboard';

interface QueueLink {
  to: string;
  icon: string;
  label: string;
  hint: string;
  count: number | null;
}

export default function AdminPage() {
  const isAdmin = useAuthStore(selectIsAdmin);
  const loadCatalog = useCatalogStore((s) => s.load);
  const catalogState = useCatalogStore((s) => s.loadState);
  const services = useCatalogStore((s) => s.services);
  const shops = useCatalogStore((s) => s.shops);
  const providers = useCatalogStore((s) => s.providers);
  const [queues, setQueues] = useState<QueueLink[]>([
    { to: ROUTES.jobsReview, icon: '🗂️', label: 'مراجعة الوظائف', hint: 'إعلانات جديدة ومعدّلة وبلاغات', count: null },
    { to: ROUTES.marketReview, icon: '🚩', label: 'بلاغات المستعمل والتبادل', hint: 'المنشورات المخفية بعد البلاغات', count: null },
    { to: ROUTES.ridesReview, icon: '🚗', label: 'بلاغات شير المواصلة', hint: 'الرحلات المخفية بعد البلاغات', count: null },
  ]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    const safeCount = (p: Promise<unknown[]>) => p.then((list) => list.length).catch(() => null);
    Promise.all([
      safeCount(jobRepo.listForReview()),
      safeCount(Promise.all([marketRepo.list('sale', { hidden: true }), marketRepo.list('swap', { hidden: true })]).then(([a, b]) => [...a, ...b])),
      safeCount(rideRepo.listHidden()),
    ]).then(([jobs, market, rides]) => {
      if (!alive) return;
      setQueues((list) => [
        { ...list[0], count: jobs },
        { ...list[1], count: market },
        { ...list[2], count: rides },
      ]);
    });
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to={ROUTES.home} replace />;

  const stats = [
    { icon: '🧰', label: 'الخدمات', value: catalogState === 'ready' ? services.length : '…' },
    { icon: '🏪', label: 'المحلات والمطاعم', value: catalogState === 'ready' ? shops.length : '…' },
    { icon: '🧑‍🔧', label: 'مقدمي الخدمة', value: catalogState === 'ready' ? providers.length : '…' },
  ];

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mb-1">🛡️ لوحة تحكم المالك</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-4">نظرة سريعة على التطبيق وطوابير المراجعة.</p>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] p-3 text-center">
            <p className="text-[22px] m-0" aria-hidden="true">{s.icon}</p>
            <p className="text-[20px] font-black text-green-dark m-0">{s.value}</p>
            <p className="text-[11px] font-bold text-text-muted m-0">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-[15px] font-black text-green-dark mb-2">طوابير المراجعة</h2>
      <ul className="m-0 p-0 list-none grid gap-2 mb-5">
        {queues.map((q) => (
          <li key={q.to}>
            <Link
              to={q.to}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[rgba(26,122,74,0.12)] no-underline hover:bg-cream/50 transition-colors"
            >
              <span className="text-[22px]" aria-hidden="true">{q.icon}</span>
              <span className="flex-1">
                <span className="block text-[14px] font-extrabold text-text">{q.label}</span>
                <span className="block text-[11px] text-text-muted">{q.hint}</span>
              </span>
              {q.count !== null && (
                <span className={`min-w-[28px] h-[28px] px-1.5 rounded-full flex items-center justify-center text-[13px] font-black ${q.count ? 'bg-gold text-black' : 'bg-gray-100 text-text-muted'}`}>
                  {q.count}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {isProviderDashboardEnabled() && (
        <p className="text-[13px] text-text-muted">
          معاينة لوحة مقدم الخدمة شغالة في المتصفح ده: <Link to={ROUTES.dashboard} className="text-green font-bold">افتحها من هنا</Link>.
        </p>
      )}

      <p className="text-[12px] text-text-muted">
        إعدادات رسوم التوصيل والعمولة لسه بتتعدل من Supabase لحد ما تتضاف هنا.
      </p>
    </div>
  );
}
