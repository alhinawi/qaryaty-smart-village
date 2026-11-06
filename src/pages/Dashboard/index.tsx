// ─── Provider dashboard: one place for a merchant or an independent
// professional to run their side of Qaryati. Admins only (the owner appoints
// them); edits stay on the device, nothing here is live for customers yet.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { ROUTES } from '@/routes';
import { useAuthStore, selectCanManageProviders } from '@/stores/useAuthStore';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useProviderDashboardStore, type ProService } from '@/stores/useProviderDashboardStore';
import { useUIStore } from '@/stores/useUIStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { sectionsOf } from '@/data/catalog';
import {
  DEFAULT_WORKING_DAYS,
  DEMO_BOOKING_REQUESTS,
  DEMO_INCOMING_ORDERS,
  PHARMACY_PACK_NOTE,
  WEEK_DAYS,
  type DemoBookingRequest,
  type DemoIncomingOrder,
} from '@/data/providerDashboard';
import { KIND_FILTER_LABELS } from '@/utils/peopleSections';
import { formatCurrency } from '@/utils/helpers';
import type { Product, Provider, Shop } from '@/types';
import { Section, Toggle, Field } from './parts';

type Tab = 'merchant' | 'pro';

export default function ProviderDashboardPage() {
  // Open to the owner and the people he appoints as admins, nowhere else
  const allowed = useAuthStore(selectCanManageProviders);
  const loadCatalog = useCatalogStore((s) => s.load);
  const catalogState = useCatalogStore((s) => s.loadState);
  const [tab, setTab] = useState<Tab>('merchant');

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  if (!allowed) return <Navigate to={ROUTES.home} replace />;

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mb-1">⚙️ لوحة مقدم الخدمة</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-4">
        دي معاينة للوحة التحكم. أي تعديل بتعمله هنا بيتحفظ على جهازك بس، ومبيأثرش على اللي العملاء شايفينه.
      </p>

      {/* merchant / professional switch */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="نوع مقدم الخدمة">
        {(
          [
            { id: 'merchant', label: '🏪 محل أو مطعم' },
            { id: 'pro', label: '🧑‍🔧 فرد أو مهني' },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-h-[44px] rounded-xl text-[14px] font-extrabold cursor-pointer border-2 transition-colors ${
              tab === t.id
                ? 'bg-green text-white border-green'
                : 'bg-white text-green border-[rgba(26,122,74,0.3)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {catalogState !== 'ready' ? (
        <p role="status" className="text-text-muted text-[14px]">بنحمّل بيانات الكتالوج...</p>
      ) : tab === 'merchant' ? (
        <MerchantPanel />
      ) : (
        <ProfessionalPanel />
      )}
    </div>
  );
}

// ─── Merchant side

function MerchantPanel() {
  const shops = useCatalogStore((s) => s.shops);
  const [shopId, setShopId] = useState<number | null>(null);
  const shop = useMemo(
    () => shops.find((s) => s.id === (shopId ?? shops[0]?.id)) ?? null,
    [shops, shopId]
  );

  if (!shop) return null;

  return (
    <>
      <label className="block mb-4">
        <span className="block text-[12px] font-bold text-text-muted mb-1">اختار المحل (للمعاينة)</span>
        <select
          value={shop.id}
          onChange={(e) => setShopId(Number(e.target.value))}
          className="w-full min-h-[44px] px-3 rounded-xl border border-[rgba(26,122,74,0.25)] bg-white text-[14px] font-bold text-text"
        >
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.name}
            </option>
          ))}
        </select>
      </label>
      <ShopInfoSection key={`info-${shop.id}`} shop={shop} />
      <ProductsSection key={`products-${shop.id}`} shop={shop} />
      {shop.kind === 'pharmacy' && <MedicinePacksSection shop={shop} />}
      <IncomingOrdersSection />
    </>
  );
}

function ShopInfoSection({ shop }: { shop: Shop }) {
  const overrides = useProviderDashboardStore((s) => s.merchants[shop.id]);
  const setShopOpen = useProviderDashboardStore((s) => s.setShopOpen);
  const setShopHours = useProviderDashboardStore((s) => s.setShopHours);
  const setShopDescription = useProviderDashboardStore((s) => s.setShopDescription);
  const showToast = useUIStore((s) => s.showToast);

  // Keyed by shop id in the parent: switching shops remounts with that shop's values
  const open = overrides?.open ?? shop.open;
  const [hours, setHours] = useState(overrides?.hours ?? shop.time);
  const [description, setDescription] = useState(overrides?.description ?? shop.description);

  return (
    <Section icon="🏪" title="بيانات المحل" hint="الاسم والوصف ومواعيد الفتح زي ما العميل بيشوفهم">
      <div className="flex items-center gap-3 mb-3">
        {shop.photo ? (
          <img src={shop.photo} alt={shop.name} className="w-14 h-14 rounded-xl object-cover bg-cream" />
        ) : (
          <span className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center text-[30px]" aria-hidden="true">
            {shop.emoji}
          </span>
        )}
        <div className="flex-1">
          <p className="text-[15px] font-black text-text m-0">{shop.name}</p>
          <p className="text-[12px] text-text-muted m-0">{shop.village ?? ''}</p>
        </div>
        <Toggle
          checked={open}
          onChange={(next) => {
            setShopOpen(shop.id, next);
            showToast(next ? `✅ «${shop.name}» بقى مفتوح للطلبات` : `⏸️ «${shop.name}» اتقفل مؤقتًا`);
          }}
          labelOn="مفتوح"
          labelOff="مغلق"
          ariaLabel={`حالة ${shop.name}`}
        />
      </div>
      <div className="grid gap-3">
        <Field label="مواعيد الفتح" value={hours} onChange={setHours} placeholder="⏰ 7ص - 12م" />
        <Field label="وصف المحل" value={description} onChange={setDescription} placeholder="بقالة ومواد غذائية متنوعة" />
        <div>
          <Button
            size="sm"
            onClick={() => {
              setShopHours(shop.id, hours.trim());
              setShopDescription(shop.id, description.trim());
              showToast('✅ اتحفظت بيانات المحل (على جهازك في المعاينة)');
            }}
          >
            احفظ البيانات
          </Button>
        </div>
      </div>
    </Section>
  );
}

function ProductsSection({ shop }: { shop: Shop }) {
  const productsState = useCatalogStore((s) => s.products[shop.id]);
  const loadProducts = useCatalogStore((s) => s.loadProducts);
  const overrides = useProviderDashboardStore((s) => s.merchants[shop.id]);
  const setProductAvailable = useProviderDashboardStore((s) => s.setProductAvailable);
  const setProductPrice = useProviderDashboardStore((s) => s.setProductPrice);
  const showToast = useUIStore((s) => s.showToast);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void loadProducts(shop);
  }, [shop, loadProducts]);

  if (productsState === 'loading' || productsState === undefined) {
    return (
      <Section icon="📦" title="المنتجات والأسعار">
        <p role="status" className="text-text-muted text-[14px]">بنحمّل قايمة المنتجات...</p>
      </Section>
    );
  }
  if (productsState === 'error') {
    return (
      <Section icon="📦" title="المنتجات والأسعار">
        <p role="alert" className="text-danger text-[14px]">ماقدرناش نجيب القايمة. جرّب تاني من فوق.</p>
      </Section>
    );
  }
  if (productsState === null) {
    return (
      <Section icon="📦" title="المنتجات والأسعار" hint="المحل ده مالوش قايمة منتجات ثابتة، الطلب بيتكتب حر">
        <p className="text-[13px] text-text-muted m-0">لو حابب تضيف قايمة لمحلك، كلّمنا من «أعلن عن محلك أو خدمتك».</p>
      </Section>
    );
  }

  const visible = query.trim()
    ? productsState.filter((p) => p.name.includes(query.trim()))
    : productsState;

  return (
    <Section
      icon="📦"
      title={`المنتجات والأسعار (${productsState.length})`}
      hint="قفل أي صنف خلص من عندك، وظبط سعره. التغيير للمعاينة بس"
    >
      <div className="mb-3">
        <Field label="دوّر على صنف" value={query} onChange={setQuery} placeholder="اكتب اسم الصنف..." />
      </div>
      {sectionsOf(visible).map((section) => (
        <div key={section || 'main'} className="mb-3">
          {section && <p className="text-[12px] font-black text-green m-0 mb-2">{section}</p>}
          <ul className="m-0 p-0 list-none grid grid-cols-1 gap-2">
            {visible
              .filter((p) => (p.section ?? '') === section)
              .map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  available={overrides?.products[p.id]?.available ?? true}
                  price={overrides?.products[p.id]?.price ?? p.price}
                  onToggle={(next) => {
                    setProductAvailable(shop.id, p.id, next);
                    showToast(next ? `✅ «${p.name}» رجع متاح` : `⏸️ «${p.name}» اتقفل مؤقتًا`);
                  }}
                  onPrice={(price) => {
                    setProductPrice(shop.id, p.id, price);
                    showToast(`💰 سعر «${p.name}» بقى ${formatCurrency(price)}`);
                  }}
                />
              ))}
          </ul>
        </div>
      ))}
      {visible.length === 0 && <p className="text-[13px] text-text-muted">مفيش صنف بالاسم ده.</p>}
    </Section>
  );
}

function ProductRow({
  product,
  available,
  price,
  onToggle,
  onPrice,
}: {
  product: Product;
  available: boolean;
  price: number;
  onToggle: (next: boolean) => void;
  onPrice: (price: number) => void;
}) {
  const [draft, setDraft] = useState(String(price));

  const commit = () => {
    const next = Number(draft);
    if (!Number.isFinite(next) || next < 0 || next === price) {
      setDraft(String(price));
      return;
    }
    onPrice(next);
  };

  return (
    <li className={`min-w-0 p-2.5 rounded-xl border ${available ? 'border-[rgba(26,122,74,0.12)] bg-cream/30' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
      <div className="flex items-start gap-2.5">
        <ProductPhoto photo={product.photo} emoji={product.emoji} className="w-11 h-11 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-extrabold text-text m-0 leading-snug">{product.name}</p>
          <p className="text-[11px] text-text-muted m-0">{product.unit}{product.rx ? ' · بروشتة' : ''}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center rounded-lg border border-[rgba(26,122,74,0.25)] bg-white min-h-[38px] px-1.5">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={draft}
            aria-label={`سعر ${product.name}`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            dir="ltr"
            className="w-[52px] border-0 bg-transparent p-0 text-center text-[13px] font-bold text-text focus:outline-none"
          />
          <span className="text-[11px] text-text-muted font-bold">ج</span>
        </div>
        <Toggle
          checked={available}
          onChange={onToggle}
          labelOn="متاح"
          labelOff="خلص"
          ariaLabel={`توفر ${product.name}`}
        />
      </div>
    </li>
  );
}

function MedicinePacksSection({ shop }: { shop: Shop }) {
  const productsState = useCatalogStore((s) => s.products[shop.id]);
  const packs = Array.isArray(productsState) ? productsState.filter((p) => p.photo).slice(0, 12) : [];

  return (
    <Section icon="💊" title="صور عبوات الأدوية" hint="الصيدلي بيراجع كل عبوة قبل ما يتبعتها">
      <p className="text-[12px] text-text-muted bg-[#fffbeb] border border-[#fde68a] rounded-xl p-2.5 mb-3">
        {PHARMACY_PACK_NOTE}
      </p>
      {packs.length ? (
        <div className="grid grid-cols-3 gap-2">
          {packs.map((p) => (
            <figure key={p.id} className="m-0 text-center">
              <ProductPhoto photo={p.photo} emoji={p.emoji} className="w-full aspect-square rounded-xl" />
              <figcaption className="text-[11px] font-bold text-text mt-1 leading-tight">
                {p.name} {p.rx && <Badge variant="danger" className="text-[9px]">بروشتة</Badge>}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-text-muted m-0">لسه مفيش صور عبوات متسجلة للأصناف دي.</p>
      )}
    </Section>
  );
}

const ORDER_BADGES: Record<DemoIncomingOrder['status'], ReactNode> = {
  new: <Badge variant="warning">⏳ جديد</Badge>,
  preparing: <Badge variant="info">🔍 بيتجهّز</Badge>,
  done: <Badge variant="success">✓ اتسلّم</Badge>,
};

function IncomingOrdersSection() {
  const [orders, setOrders] = useState<DemoIncomingOrder[]>(DEMO_INCOMING_ORDERS);
  const showToast = useUIStore((s) => s.showToast);

  const advance = (order: DemoIncomingOrder) => {
    const next = order.status === 'new' ? 'preparing' : 'done';
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    showToast(next === 'preparing' ? `🔍 اتقبل طلب ${order.customer}` : `🎉 طلب ${order.customer} اتسلّم`);
  };

  return (
    <Section icon="🧾" title="الطلبات الواردة" hint="دي لسه مش طلبات حقيقية، بس كده هيبقى شكلها أول ما توصل">
      <ul className="m-0 p-0 list-none grid grid-cols-1 gap-2">
        {orders.map((o) => (
          <li key={o.id} className="p-3 rounded-xl border border-[rgba(26,122,74,0.12)] bg-cream/30">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[13px] font-extrabold text-text m-0">{o.customer} <span className="text-[11px] text-text-muted font-bold">· {o.ago}</span></p>
              {ORDER_BADGES[o.status]}
            </div>
            <p className="text-[12px] text-text-muted m-0 mb-2">{o.items}</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-black text-green m-0">{formatCurrency(o.total)}</p>
              {o.status !== 'done' && (
                <Button size="sm" variant={o.status === 'new' ? 'primary' : 'success'} onClick={() => advance(o)}>
                  {o.status === 'new' ? 'اقبل الطلب' : 'اتسلّم ✓'}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ─── Independent professional side

function ProfessionalPanel() {
  const providers = useCatalogStore((s) => s.providers);
  const [providerId, setProviderId] = useState<number | null>(null);
  const provider = useMemo(
    () => providers.find((p) => p.id === (providerId ?? providers[0]?.id)) ?? null,
    [providers, providerId]
  );

  if (!provider) return null;

  return (
    <>
      <label className="block mb-4">
        <span className="block text-[12px] font-bold text-text-muted mb-1">اختار مقدم الخدمة (للمعاينة)</span>
        <select
          value={provider.id}
          onChange={(e) => setProviderId(Number(e.target.value))}
          className="w-full min-h-[44px] px-3 rounded-xl border border-[rgba(26,122,74,0.25)] bg-white text-[14px] font-bold text-text"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.role ?? KIND_FILTER_LABELS[p.kind]}
            </option>
          ))}
        </select>
      </label>
      <ProProfileSection key={`profile-${provider.id}`} provider={provider} />
      <ProServicesSection key={`services-${provider.id}`} provider={provider} />
      <ProAvailabilitySection key={`availability-${provider.id}`} provider={provider} />
      <BookingsSection />
    </>
  );
}

function defaultServices(provider: Provider): ProService[] {
  return [
    {
      id: 'main',
      name: provider.role ?? KIND_FILTER_LABELS[provider.kind],
      price: provider.price,
      active: provider.active,
    },
  ];
}

function ProProfileSection({ provider }: { provider: Provider }) {
  const overrides = useProviderDashboardStore((s) => s.professionals[provider.id]);
  const setProBio = useProviderDashboardStore((s) => s.setProBio);
  const setProVacation = useProviderDashboardStore((s) => s.setProVacation);
  const showToast = useUIStore((s) => s.showToast);
  // Keyed by provider id in the parent: switching providers remounts with their values
  const [photoFailed, setPhotoFailed] = useState(false);
  const [bio, setBio] = useState(overrides?.bio ?? provider.bio);

  const vacation = overrides?.vacation ?? false;

  return (
    <Section icon="👤" title="البروفايل" hint="صورتك ونبذتك زي ما العميل بيشوفهم">
      <div className="flex items-center gap-3 mb-3">
        {!photoFailed && provider.photo ? (
          <img
            src={provider.photo}
            alt={provider.name}
            onError={() => setPhotoFailed(true)}
            className="w-14 h-14 rounded-full object-cover bg-cream"
          />
        ) : (
          <span className="w-14 h-14 rounded-full bg-green text-white flex items-center justify-center text-[20px] font-black" aria-hidden="true">
            {provider.name.replace(/^(أ\.|د\.)\s*/, '').slice(0, 2)}
          </span>
        )}
        <div className="flex-1">
          <p className="text-[15px] font-black text-text m-0">{provider.name}</p>
          <p className="text-[12px] text-text-muted m-0">
            {provider.role ?? KIND_FILTER_LABELS[provider.kind]} · ⭐ {provider.rating} ({provider.reviews} تقييم)
          </p>
          <p className="text-[12px] text-text-muted m-0">{provider.area}، {provider.village}</p>
        </div>
      </div>
      <div className="mb-3">
        <Toggle
          checked={!vacation}
          onChange={(available) => {
            setProVacation(provider.id, !available);
            showToast(available ? '✅ بقيت متاح للحجوزات' : '⏸️ الحجوزات واقفة مؤقتًا');
          }}
          labelOn="متاح للحجز"
          labelOff="مش متاح"
          ariaLabel={`توفر ${provider.name} للحجز`}
        />
      </div>
      <div className="grid gap-3">
        <label className="block">
          <span className="block text-[12px] font-bold text-text-muted mb-1">نبذة عنك</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-[rgba(26,122,74,0.25)] bg-cream/40 text-[14px] font-bold text-text focus:outline-none focus:border-green resize-y"
          />
        </label>
        <div>
          <Button
            size="sm"
            onClick={() => {
              setProBio(provider.id, bio.trim());
              showToast('✅ اتحفظت النبذة (على جهازك في المعاينة)');
            }}
          >
            احفظ النبذة
          </Button>
        </div>
      </div>
    </Section>
  );
}

function ProServicesSection({ provider }: { provider: Provider }) {
  const overrides = useProviderDashboardStore((s) => s.professionals[provider.id]);
  const toggleProService = useProviderDashboardStore((s) => s.toggleProService);
  const addProService = useProviderDashboardStore((s) => s.addProService);
  const showToast = useUIStore((s) => s.showToast);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const defaults = defaultServices(provider);
  const services = overrides && overrides.services.length ? overrides.services : defaults;

  return (
    <Section icon="🛠️" title="خدماتي وأسعاري" hint="قفل خدمة مؤقتًا من غير ما تمسحها">
      <ul className="m-0 p-0 list-none grid grid-cols-1 gap-2 mb-3">
        {services.map((svc) => (
          <li key={svc.id} className={`flex min-w-0 items-center gap-2.5 p-2.5 rounded-xl border ${svc.active ? 'border-[rgba(26,122,74,0.12)] bg-cream/30' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-extrabold text-text m-0 leading-snug">{svc.name}</p>
              <p className="text-[11px] text-text-muted m-0">{svc.price}</p>
            </div>
            <Toggle
              checked={svc.active}
              onChange={() => {
                toggleProService(provider.id, svc.id, defaults);
                showToast(svc.active ? `⏸️ «${svc.name}» اتقفلت مؤقتًا` : `✅ «${svc.name}» رجعت شغالة`);
              }}
              labelOn="شغالة"
              labelOff="واقفة"
              ariaLabel={`خدمة ${svc.name}`}
            />
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-[1fr_110px] gap-2 items-end">
        <Field label="خدمة جديدة" value={name} onChange={setName} placeholder="مثال: تسليك مجاري" />
        <Field label="السعر" value={price} onChange={setPrice} placeholder="من 50 ج" />
      </div>
      <div className="mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (name.trim().length < 2) {
              showToast('⚠️ اكتب اسم الخدمة الأول');
              return;
            }
            addProService(provider.id, name.trim(), price.trim() || 'حسب المعاينة', defaults);
            setName('');
            setPrice('');
            showToast(`✅ اتضافت «${name.trim()}» لخدماتك`);
          }}
        >
          + ضيف الخدمة
        </Button>
      </div>
    </Section>
  );
}

function ProAvailabilitySection({ provider }: { provider: Provider }) {
  const overrides = useProviderDashboardStore((s) => s.professionals[provider.id]);
  const setProAvailability = useProviderDashboardStore((s) => s.setProAvailability);
  const showToast = useUIStore((s) => s.showToast);

  // Keyed by provider id in the parent: switching providers remounts with their values
  const [days, setDays] = useState<string[]>(overrides?.days ?? [...DEFAULT_WORKING_DAYS]);
  const [from, setFrom] = useState(overrides?.from ?? '9:00 ص');
  const [to, setTo] = useState(overrides?.to ?? '9:00 م');

  const toggleDay = (day: string) =>
    setDays((list) => (list.includes(day) ? list.filter((d) => d !== day) : [...list, day]));

  return (
    <Section icon="🗓️" title="مواعيد الشغل" hint="الأيام والساعات اللي تقدر تستقبل فيها حجوزات">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {WEEK_DAYS.map((day) => {
          const on = days.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              onClick={() => toggleDay(day)}
              className={`min-h-[38px] px-3 rounded-full text-[12px] font-extrabold cursor-pointer border transition-colors ${
                on ? 'bg-green text-white border-green' : 'bg-white text-text-muted border-gray-300'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Field label="من الساعة" value={from} onChange={setFrom} placeholder="9:00 ص" />
        <Field label="للساعة" value={to} onChange={setTo} placeholder="9:00 م" />
      </div>
      <Button
        size="sm"
        onClick={() => {
          if (!days.length) {
            showToast('⚠️ اختار يوم واحد على الأقل');
            return;
          }
          setProAvailability(provider.id, days, from.trim(), to.trim());
          showToast('✅ اتحفظت مواعيدك (على جهازك في المعاينة)');
        }}
      >
        احفظ المواعيد
      </Button>
    </Section>
  );
}

const BOOKING_BADGES: Record<DemoBookingRequest['status'], ReactNode> = {
  new: <Badge variant="warning">⏳ جديد</Badge>,
  accepted: <Badge variant="success">✓ اتقبل</Badge>,
  declined: <Badge variant="danger">معتذر</Badge>,
};

function BookingsSection() {
  const [bookings, setBookings] = useState<DemoBookingRequest[]>(DEMO_BOOKING_REQUESTS);
  const showToast = useUIStore((s) => s.showToast);

  const answer = (booking: DemoBookingRequest, status: 'accepted' | 'declined') => {
    setBookings((list) => list.map((b) => (b.id === booking.id ? { ...b, status } : b)));
    showToast(status === 'accepted' ? `✅ اتقبل حجز ${booking.customer}` : `اعتذرت عن حجز ${booking.customer}`);
  };

  return (
    <Section icon="📅" title="طلبات الحجز" hint="دي لسه مش حجوزات حقيقية، بس كده هيبقى شكلها أول ما توصل">
      <ul className="m-0 p-0 list-none grid grid-cols-1 gap-2">
        {bookings.map((b) => (
          <li key={b.id} className="p-3 rounded-xl border border-[rgba(26,122,74,0.12)] bg-cream/30">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[13px] font-extrabold text-text m-0">{b.customer}</p>
              {BOOKING_BADGES[b.status]}
            </div>
            <p className="text-[12px] text-text-muted m-0 mb-2">{b.detail}</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-black text-green m-0">🗓️ {b.day} · {b.time}</p>
              {b.status === 'new' && (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => answer(b, 'accepted')}>اقبل</Button>
                  <Button size="sm" variant="outline" onClick={() => answer(b, 'declined')}>اعتذار</Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
