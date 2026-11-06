// ─── Staff panel (/admin): one panel, and every staff tier sees its own
// sections (src/config/staffTiers.ts). The owner is the only one who appoints
// supervisors or changes their tiers; review queues live on their own pages.
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { ROUTES } from '@/routes';
import { authRepo, jobRepo, marketRepo, rideRepo } from '@/repositories';
import { useAuthStore, selectIsStaff, selectRole, selectUser } from '@/stores/useAuthStore';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useUIStore } from '@/stores/useUIStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { Badge } from '@/components/ui/Badge';
import {
  APPOINTABLE_ROLES,
  STAFF_ROLE_HINTS,
  STAFF_ROLE_LABELS,
  adminSectionsFor,
  isStaffRole,
  type StaffRole,
} from '@/config/staffTiers';
import type { AuthUser, UserRole } from '@/types';

interface QueueLink {
  to: string;
  icon: string;
  label: string;
  hint: string;
  count: number | null;
}

const TIER_BADGE: Record<StaffRole, 'warning' | 'success' | 'info'> = {
  owner: 'warning',
  admin: 'success',
  content_admin: 'info',
  orders_admin: 'info',
};

export default function AdminPage() {
  const role = useAuthStore(selectRole);
  const isStaff = useAuthStore(selectIsStaff);
  const sections = adminSectionsFor(role);
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
    if (!sections.reviewQueues) return;
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
  }, [sections.reviewQueues]);

  if (!isStaff) return <Navigate to={ROUTES.home} replace />;

  const stats = [
    { icon: '🧰', label: 'الخدمات', value: catalogState === 'ready' ? services.length : '…' },
    { icon: '🏪', label: 'المحلات والمطاعم', value: catalogState === 'ready' ? shops.length : '…' },
    { icon: '🧑‍🔧', label: 'مقدمي الخدمة', value: catalogState === 'ready' ? providers.length : '…' },
  ];

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mb-1">
        🛡️ لوحة التحكم{' '}
        {isStaffRole(role) && <Badge variant={TIER_BADGE[role]}>{STAFF_ROLE_LABELS[role]}</Badge>}
      </h1>
      <p className="text-[13px] text-text-muted mt-1 mb-4">
        {isStaffRole(role) ? STAFF_ROLE_HINTS[role] : ''}
      </p>

      {sections.overview && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] p-3 text-center">
              <p className="text-[22px] m-0" aria-hidden="true">{s.icon}</p>
              <p className="text-[20px] font-black text-green-dark m-0">{s.value}</p>
              <p className="text-[11px] font-bold text-text-muted m-0">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {sections.reviewQueues && (
        <>
          <h2 className="text-[15px] font-black text-green-dark mb-2">طوابير المراجعة</h2>
          <ul className="m-0 p-0 list-none grid grid-cols-1 gap-2 mb-5">
            {queues.map((q) => (
              <li key={q.to}>
                <Link
                  to={q.to}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[rgba(26,122,74,0.12)] no-underline hover:bg-cream/50 transition-colors"
                >
                  <span className="text-[22px]" aria-hidden="true">{q.icon}</span>
                  <span className="flex-1 min-w-0">
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
        </>
      )}

      {sections.providerDashboard && (
        <p className="text-[13px] text-text-muted mb-5">
          لوحة مقدم الخدمة: <Link to={ROUTES.dashboard} className="text-green font-bold">افتحها من هنا</Link> (المحلات ومقدمي الخدمة والطلبات).
        </p>
      )}

      {sections.supervisors && <SupervisorsSection />}

      {sections.feesNote && (
        <p className="text-[12px] text-text-muted">
          إعدادات رسوم التوصيل والعمولة لسه بتتعدل من Supabase لحد ما تتضاف هنا.
        </p>
      )}
    </div>
  );
}

// ─── Supervisors (owner only): appoint a tier, change it, or revoke it
function SupervisorsSection() {
  const me = useAuthStore(selectUser);
  const showToast = useUIStore((s) => s.showToast);
  const ask = useConfirmStore((s) => s.ask);
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    authRepo
      .listUsers()
      .then((list) => {
        setUsers(list);
        setError('');
      })
      .catch((err: unknown) => {
        setUsers([]);
        setError(err instanceof Error ? err.message : 'ماقدرناش نجيب المستخدمين');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (user: AuthUser, next: UserRole) => {
    if (next === user.role) return;
    if (next === 'customer') {
      const ok = await ask({
        title: 'شيل الإشراف',
        message: `تشيل صلاحيات المشرف من «${user.name}»؟ حسابه هيفضل شغال عادي، بس مش هيشوف لوحات التحكم.`,
        confirmLabel: 'شيل الإشراف',
        cancelLabel: 'رجوع',
      });
      if (!ok) return;
    }
    setBusyId(user.id);
    try {
      await authRepo.setRole(user.id, next);
      showToast(
        next === 'customer'
          ? `«${user.name}» مابقاش مشرف`
          : `✅ «${user.name}» بقى ${STAFF_ROLE_LABELS[next as StaffRole]}`
      );
      load();
    } catch (err) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'حصلت مشكلة'}`);
    } finally {
      setBusyId('');
    }
  };

  const q = query.trim();
  const visible = (users ?? []).filter(
    (u) => !q || u.name.includes(q) || u.email.includes(q) || u.phone.includes(q) || u.username.includes(q)
  );
  const staff = visible.filter((u) => isStaffRole(u.role));
  const customers = visible.filter((u) => !isStaffRole(u.role));

  return (
    <section className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] p-4 mb-5">
      <h2 className="text-[15px] font-black text-green-dark m-0 mb-1">🧑‍💼 المشرفين</h2>
      <p className="text-[12px] text-text-muted mt-0 mb-1">
        عيّن أي حد وحدّد درجته، وشيله في أي وقت. الدرجات:
      </p>
      <ul className="m-0 mb-3 p-0 list-none grid grid-cols-1 gap-1">
        {APPOINTABLE_ROLES.map((r) => (
          <li key={r} className="text-[11px] text-text-muted">
            <span className="font-extrabold text-text">{STAFF_ROLE_LABELS[r]}:</span> {STAFF_ROLE_HINTS[r]}
          </li>
        ))}
      </ul>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="دوّر بالاسم أو الإيميل أو الموبايل..."
        aria-label="دوّر على مستخدم"
        className="w-full min-h-[42px] px-3 rounded-xl border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[14px] font-bold text-text focus:outline-none focus:border-green mb-3"
      />
      {error && <p role="alert" className="text-danger text-[13px]">{error}</p>}
      {users === null && !error && <p role="status" className="text-text-muted text-[13px]">بنحمّل المستخدمين...</p>}
      {users !== null && (
        <ul className="m-0 p-0 list-none grid grid-cols-1 gap-2">
          {[...staff, ...customers].slice(0, 20).map((u) => (
            <li key={u.id} className="flex min-w-0 items-center gap-2.5 p-2.5 rounded-xl border border-[rgba(26,122,74,0.12)] bg-cream/30">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-extrabold text-text m-0 truncate">
                  {u.name} {u.id === me?.id && <span className="text-text-muted font-bold">(انت)</span>}
                </p>
                <p className="text-[11px] text-text-muted m-0 truncate" dir="ltr">{u.email || u.phone}</p>
              </div>
              {isStaffRole(u.role) && <Badge variant={TIER_BADGE[u.role]}>{STAFF_ROLE_LABELS[u.role]}</Badge>}
              {u.id !== me?.id && u.role !== 'owner' && (
                <select
                  aria-label={`درجة ${u.name}`}
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => void changeRole(u, e.target.value as UserRole)}
                  className="min-h-[38px] max-w-[132px] px-2 rounded-lg border border-[rgba(26,122,74,0.25)] bg-white text-[12px] font-bold text-text focus:outline-none focus:border-green"
                >
                  <option value="customer">عميل</option>
                  {APPOINTABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
                  ))}
                </select>
              )}
            </li>
          ))}
          {visible.length === 0 && <p className="text-[13px] text-text-muted">مفيش مستخدم بالاسم ده.</p>}
          {visible.length > 20 && (
            <p className="text-[12px] text-text-muted">أول 20 نتيجة بس — دوّر بالاسم عشان توصل لحد بعينه.</p>
          )}
        </ul>
      )}
    </section>
  );
}
