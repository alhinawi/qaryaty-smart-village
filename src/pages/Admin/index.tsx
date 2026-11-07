// ─── Staff panel (/admin): one panel, and every staff tier sees its own
// sections (src/config/staffTiers.ts). The owner is the only one who appoints
// supervisors or changes their tiers; review queues live on their own pages.
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { ROUTES } from '@/routes';
import { addProvider, addShop, authRepo, jobRepo, marketRepo, rideRepo, settingsRepo } from '@/repositories';
import { setDemoModeFlag } from '@/config/demoMode';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useAuthStore, selectIsStaff, selectRole, selectUser } from '@/stores/useAuthStore';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useUIStore } from '@/stores/useUIStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { Badge } from '@/components/ui/Badge';
import { AccountPicker } from '@/components/ui/AccountPicker';
import {
  APPOINTABLE_ROLES,
  STAFF_ROLE_HINTS,
  STAFF_ROLE_LABELS,
  adminSectionsFor,
  isStaffRole,
  type StaffRole,
} from '@/config/staffTiers';
import type { AuthUser, Gender, ProviderKind, ShopKind, UserRole } from '@/types';
import { SHOP_KIND_LABELS } from '@/utils/searchScreen';
import { PROVIDER_KIND_LABELS } from '@/data/teachers';
import { Field } from '@/pages/Dashboard/parts';

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
  // وضع العرض التجريبي: owner-only switch, flips the whole site at once
  const demoMode = useDemoMode();
  const [demoBusy, setDemoBusy] = useState(false);

  const toggleDemoMode = async () => {
    const next = !demoMode;
    setDemoBusy(true);
    try {
      await settingsRepo.setDemoMode(next);
      setDemoModeFlag(next);
      await loadCatalog(true);
      useUIStore.getState().showToast(
        next ? '✅ الوضع التجريبي شغال — المحتوى التجريبي ظاهر' : '🏪 الوضع الحقيقي شغال — المحتوى التجريبي اتخفى'
      );
    } catch {
      useUIStore.getState().showToast('⚠️ الإعداد ماتحفظش، جرّب تاني');
    } finally {
      setDemoBusy(false);
    }
  };

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

      {role === 'owner' && (
        <div className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] p-4 mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-black text-green-dark m-0">🎭 وضع العرض التجريبي</h2>
            <p className="text-[12px] text-text-muted leading-relaxed m-0 mt-1">
              {demoMode
                ? 'شغال: الزوار شايفين المحلات والخدمات والمنتجات التجريبية. اقفله لما تطلق الموقع بمحتوى حقيقي.'
                : 'مقفول: الموقع في الوضع الحقيقي — مفيش أي محتوى تجريبي ظاهر. شغّله تاني في أي وقت، ومفيش بيانات بتتمسح.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            aria-label="وضع العرض التجريبي"
            disabled={demoBusy}
            onClick={() => void toggleDemoMode()}
            className={`shrink-0 w-14 h-8 rounded-full p-1 transition-colors duration-200 cursor-pointer border-none ${demoMode ? 'bg-green' : 'bg-gray-300'}`}
          >
            <span
              className={`block w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${demoMode ? '-translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>
      )}

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

      {sections.providerDashboard && <AddProviderSection />}

      {sections.supervisors && <SupervisorsSection />}

      {sections.feesNote && (
        <p className="text-[12px] text-text-muted">
          إعدادات رسوم التوصيل والعمولة لسه بتتعدل من Supabase لحد ما تتضاف هنا.
        </p>
      )}
    </div>
  );
}

// ─── Add a shop or a professional (المحلات والمهنيين): the owner/admin creates
// the record here and links it to the account that will manage it. New rows
// show to customers immediately.
function AddProviderSection() {
  const showToast = useUIStore((s) => s.showToast);
  const services = useCatalogStore((s) => s.services);
  const loadCatalog = useCatalogStore((s) => s.load);
  const [tab, setTab] = useState<'shop' | 'pro'>('shop');
  const [busy, setBusy] = useState(false);
  // Account linking: only staff who can read all profiles (owner/admin) get the picker
  const [users, setUsers] = useState<AuthUser[] | null>(null);

  useEffect(() => {
    authRepo
      .listUsers()
      .then(setUsers)
      .catch(() => setUsers(null));
  }, []);

  // shop form
  const [shopName, setShopName] = useState('');
  const [shopKind, setShopKind] = useState<ShopKind>('grocery');
  const [shopEmoji, setShopEmoji] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopTime, setShopTime] = useState('');
  const [shopOwner, setShopOwner] = useState('');

  // professional form
  const [proName, setProName] = useState('');
  const [proKind, setProKind] = useState<ProviderKind>('worker');
  const [proGender, setProGender] = useState<Gender>('male');
  const [proService, setProService] = useState('');
  const [proVillage, setProVillage] = useState('');
  const [proArea, setProArea] = useState('');
  const [proPrice, setProPrice] = useState('');
  const [proBio, setProBio] = useState('');
  const [proOwner, setProOwner] = useState('');

  const submitShop = async () => {
    if (!shopName.trim() || !shopDesc.trim()) {
      showToast('⚠️ اكتب اسم المحل ووصفه الأول');
      return;
    }
    setBusy(true);
    try {
      await addShop({
        name: shopName.trim(),
        kind: shopKind,
        emoji: shopEmoji.trim() || SHOP_KIND_LABELS[shopKind]?.emoji || '🏪',
        description: shopDesc.trim(),
        time: shopTime.trim(),
        ...(shopOwner ? { ownerProfileId: shopOwner } : {}),
      });
      showToast(`✅ «${shopName.trim()}» اتضاف وبقى ظاهر للزباين`);
      setShopName(''); setShopEmoji(''); setShopDesc(''); setShopTime(''); setShopOwner('');
      void loadCatalog(true);
    } catch (err) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'حصلت مشكلة'}`);
    } finally {
      setBusy(false);
    }
  };

  const submitPro = async () => {
    const serviceId = Number(proService);
    if (!proName.trim() || !Number.isFinite(serviceId) || !proVillage.trim()) {
      showToast('⚠️ اكتب الاسم والخدمة والقرية الأول');
      return;
    }
    const service = services.find((svc) => svc.id === serviceId);
    setBusy(true);
    try {
      await addProvider({
        name: proName.trim(),
        kind: proKind,
        serviceId,
        gender: proGender,
        role: service?.name ?? PROVIDER_KIND_LABELS[proKind][proGender],
        village: proVillage.trim(),
        area: proArea.trim(),
        price: proPrice.trim() || 'حسب الاتفاق',
        bio: proBio.trim(),
        ...(proOwner ? { ownerProfileId: proOwner } : {}),
      });
      showToast(`✅ «${proName.trim()}» اتضاف وبقى ظاهر للزباين`);
      setProName(''); setProVillage(''); setProArea(''); setProPrice(''); setProBio(''); setProOwner('');
      void loadCatalog(true);
    } catch (err) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'حصلت مشكلة'}`);
    } finally {
      setBusy(false);
    }
  };

  const selectCls =
    'w-full min-h-[42px] px-3 rounded-xl border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[14px] font-bold text-text focus:outline-none focus:border-green';
  const ownerPicker = (value: string, setValue: (v: string) => void, label: string) =>
    users && users.length > 0 ? (
      <AccountPicker users={users} value={value} onChange={setValue} label={label} />
    ) : (
      <p className="text-[11px] text-text-muted m-0">
        ربط بحساب بيشتغل لما يكون معاك صلاحية قراية الحسابات (المالك).
      </p>
    );

  return (
    <section className="bg-white rounded-2xl border border-[rgba(26,122,74,0.12)] p-4 mb-5">
      <h2 className="text-[15px] font-black text-green-dark m-0 mb-1">➕ ضيف محل أو مهني</h2>
      <p className="text-[12px] text-text-muted mt-0 mb-3">
        أي إضافة هنا بتظهر للزباين على طول. لو ربطتها بحساب، صاحب الحساب يديرها من لوحة مقدم الخدمة.
      </p>
      <div className="flex gap-2 mb-3" role="tablist" aria-label="نوع الإضافة">
        {(
          [
            { id: 'shop', label: '🏪 محل' },
            { id: 'pro', label: '🧑‍🔧 مهني' },
          ] as { id: 'shop' | 'pro'; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-[40px] px-4 rounded-xl border text-[13px] font-extrabold cursor-pointer transition-colors ${
              tab === t.id
                ? 'bg-green text-white border-green'
                : 'bg-white text-green-dark border-[rgba(26,122,74,0.25)] hover:bg-cream/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shop' ? (
        <div className="grid gap-3">
          <Field label="اسم المحل" value={shopName} onChange={setShopName} placeholder="مثال: سوبر ماركت البركة" />
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[12px] font-bold text-text-muted mb-1">نوع المحل</span>
              <select value={shopKind} onChange={(e) => setShopKind(e.target.value as ShopKind)} className={selectCls}>
                {Object.entries(SHOP_KIND_LABELS)
                  .filter(([kind]) => kind !== 'jewelry')
                  .map(([kind, info]) => (
                    <option key={kind} value={kind}>
                      {info.emoji} {info.label}
                    </option>
                  ))}
              </select>
            </label>
            <Field label="إيموجي (اختياري)" value={shopEmoji} onChange={setShopEmoji} placeholder="🛒" />
          </div>
          <Field label="وصف المحل" value={shopDesc} onChange={setShopDesc} placeholder="بقالة ومواد غذائية متنوعة" />
          <Field label="مواعيد الفتح (اختياري)" value={shopTime} onChange={setShopTime} placeholder="⏰ 7ص - 12م" />
          {ownerPicker(shopOwner, setShopOwner, 'اربطه بحساب يديره (اختياري)')}
          <div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitShop()}
              className="min-h-[42px] px-5 rounded-xl bg-green text-white text-[14px] font-extrabold border-none cursor-pointer hover:bg-green-dark transition-colors disabled:opacity-60"
            >
              {busy ? 'بيضاف...' : 'ضيف المحل'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <Field label="الاسم" value={proName} onChange={setProName} placeholder="مثال: عم محمود" />
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[12px] font-bold text-text-muted mb-1">الخدمة</span>
              <select value={proService} onChange={(e) => setProService(e.target.value)} className={selectCls}>
                <option value="">اختار الخدمة...</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.emoji} {svc.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[12px] font-bold text-text-muted mb-1">النوع</span>
              <select value={proKind} onChange={(e) => setProKind(e.target.value as ProviderKind)} className={selectCls}>
                {(Object.keys(PROVIDER_KIND_LABELS) as ProviderKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {PROVIDER_KIND_LABELS[kind][proGender]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[12px] font-bold text-text-muted mb-1">الجنس</span>
              <select value={proGender} onChange={(e) => setProGender(e.target.value as Gender)} className={selectCls}>
                <option value="male">راجل</option>
                <option value="female">ست</option>
              </select>
            </label>
            <Field label="القرية" value={proVillage} onChange={setProVillage} placeholder="ميت غمر" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="المنطقة (اختياري)" value={proArea} onChange={setProArea} placeholder="شارع الجمهورية" />
            <Field label="السعر (اختياري)" value={proPrice} onChange={setProPrice} placeholder="من 50 جنيه" />
          </div>
          <Field label="نبذة (اختياري)" value={proBio} onChange={setProBio} placeholder="خبرة 15 سنة في السباكة" />
          {ownerPicker(proOwner, setProOwner, 'اربطه بحساب يديره (اختياري)')}
          <div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitPro()}
              className="min-h-[42px] px-5 rounded-xl bg-green text-white text-[14px] font-extrabold border-none cursor-pointer hover:bg-green-dark transition-colors disabled:opacity-60"
            >
              {busy ? 'بيضاف...' : 'ضيف المهني'}
            </button>
          </div>
        </div>
      )}
    </section>
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
