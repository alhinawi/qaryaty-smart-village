// ─── /market/sale and /market/swap: browse posts, filter, search, post a new one
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { marketRepo, type ListingKind, type MarketListing } from '@/repositories';
import {
  EMPTY_FILTERS,
  KIND_INFO,
  LISTING_CATEGORIES,
  filterListings,
  parsePrice,
  type ListingFilters,
} from '@/config/market';
import { ROUTES } from '@/routes';
import { useUserStore } from '@/stores/useUserStore';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackBar, KindSwitch, ListingCard, SafetyNote, shortVillage, useMarketUser, usePageTitle } from './shared';

export default function MarketListPage({ kind }: { kind: ListingKind }) {
  const info = KIND_INFO[kind];
  usePageTitle(`${info.title} • قريتي`);
  const user = useMarketUser();
  const navigate = useNavigate();
  const myVillage = useUserStore((s) => s.profile.village);

  const [listings, setListings] = useState<MarketListing[] | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [filters, setFilters] = useState<ListingFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');

  useEffect(() => {
    let alive = true;
    marketRepo
      .list(kind)
      .then((l) => alive && setListings(l))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'حصلت مشكلة، جرّب تاني'));
    return () => {
      alive = false;
    };
  }, [kind, reload]);

  // Filters start empty for sale and for swap: App gives each kind its own key,
  // so switching remounts this page.

  const villages = useMemo(() => {
    const set = new Set((listings ?? []).map((l) => l.village));
    return [...set].sort((a, b) => a.localeCompare(b, 'ar'));
  }, [listings]);
  const shown = useMemo(() => filterListings(listings ?? [], filters), [listings, filters]);
  const activeFilters =
    (filters.village ? 1 : 0) + (filters.category ? 1 : 0) + (filters.minPrice != null || filters.maxPrice != null ? 1 : 0);

  const goPost = () => {
    const to = `${ROUTES.marketNew}?kind=${kind}`;
    if (user) navigate(to);
    else navigate(ROUTES.login, { state: { from: to } });
  };

  return (
    <section className="max-w-[960px] mx-auto pb-24" aria-labelledby="market-title">
      <BackBar title="المستعمل والتبادل" to={ROUTES.home} />
      <KindSwitch kind={kind} />

      <header className="bg-linear-to-br from-green to-green-dark rounded-2xl p-5 text-white mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id="market-title" className="text-[1.125rem] font-black">
            <span aria-hidden="true">{info.icon} </span>
            {info.title}
          </h3>
          <p className="text-white/90 text-[13px] mt-1 leading-relaxed">{info.tagline}</p>
        </div>
        <button
          type="button"
          onClick={goPost}
          className="shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-gold text-black font-extrabold text-sm"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {kind === 'sale' ? 'اعرض حاجة' : 'اعرض للتبادل'}
        </button>
      </header>

      {/* Search + filters */}
      <div className="flex gap-2 mb-3">
        <label className="flex-1 min-w-0 flex items-center gap-2 bg-white rounded-xl px-3 min-h-[46px] shadow-card">
          <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
          <span className="sr-only">دوّر</span>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder={kind === 'sale' ? 'دوّر على تلاجة، موبايل، كنبة…' : 'دوّر في إعلانات التبادل…'}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={`relative min-w-[46px] min-h-[46px] rounded-xl shadow-card flex items-center justify-center ${
            showFilters ? 'bg-green text-white' : 'bg-white text-green-dark'
          }`}
          aria-label="الفلاتر"
        >
          <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gold text-black text-[11px] font-black flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1" role="group" aria-label="الأقسام">
        <button
          type="button"
          onClick={() => setFilters((f) => ({ ...f, category: '' }))}
          aria-pressed={!filters.category}
          className={`shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-bold border ${
            !filters.category ? 'bg-green text-white border-green' : 'bg-white text-text border-[rgba(26,122,74,0.15)]'
          }`}
        >
          الكل
        </button>
        {LISTING_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilters((f) => ({ ...f, category: f.category === c.id ? '' : c.id }))}
            aria-pressed={filters.category === c.id}
            className={`shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-bold border whitespace-nowrap ${
              filters.category === c.id ? 'bg-green text-white border-green' : 'bg-white text-text border-[rgba(26,122,74,0.15)]'
            }`}
          >
            <span aria-hidden="true">{c.icon} </span>
            {c.label}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-card mb-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13px] font-bold">
            القرية
            <select
              value={filters.village}
              onChange={(e) => setFilters((f) => ({ ...f, village: e.target.value }))}
              className="q-input"
            >
              <option value="">كل القرى</option>
              {villages.map((v) => (
                <option key={v} value={v}>
                  {v === myVillage ? `${shortVillage(v)} (قريتي)` : v}
                </option>
              ))}
            </select>
          </label>
          {kind === 'sale' && (
            <fieldset className="flex flex-col gap-1">
              <legend className="text-[13px] font-bold mb-1">السعر (جنيه)</legend>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  placeholder="من"
                  aria-label="السعر من"
                  value={minText}
                  onChange={(e) => {
                    setMinText(e.target.value);
                    setFilters((f) => ({ ...f, minPrice: parsePrice(e.target.value) }));
                  }}
                  className="q-input flex-1 min-w-0"
                />
                <input
                  inputMode="numeric"
                  placeholder="لحد"
                  aria-label="السعر لحد"
                  value={maxText}
                  onChange={(e) => {
                    setMaxText(e.target.value);
                    setFilters((f) => ({ ...f, maxPrice: parsePrice(e.target.value) }));
                  }}
                  className="q-input flex-1 min-w-0"
                />
              </div>
            </fieldset>
          )}

        </div>
      )}

      {user && (
        <Link to={ROUTES.marketMine} className="inline-flex items-center gap-1 text-[13px] font-extrabold text-green mb-3">
          📋 إعلاناتي ورسايلها
        </Link>
      )}

      {error ? (
        <EmptyState emoji="😕" title="ماقدرناش نجيب الإعلانات" description={error} actionText="جرّب تاني" onAction={() => {
          setError('');
          setListings(null);
          setReload((n) => n + 1);
        }} />
      ) : listings === null ? (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" aria-busy="true" aria-label="بيحمّل">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <EmptyState
          emoji={info.icon}
          title={listings.length === 0 ? 'لسه مفيش إعلانات' : 'مفيش حاجة بالمواصفات دي'}
          description={
            listings.length === 0
              ? kind === 'sale'
                ? 'كن أول واحد يعرض حاجة للبيع في قريتك.'
                : 'كن أول واحد يعرض حاجة للتبادل في قريتك.'
              : 'غيّر البحث أو اختيارات الفلاتر.'
          }
          actionText={listings.length === 0 ? (kind === 'sale' ? 'اعرض حاجة' : 'اعرض للتبادل') : undefined}
          onAction={listings.length === 0 ? goPost : undefined}
        />
      ) : (
        <>
          <p className="text-[12px] text-text-muted mb-2" aria-live="polite">
            {shown.length} إعلان
          </p>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {shown.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ul>
        </>
      )}

      <div className="mt-6">
        <SafetyNote />
      </div>

      {/* The header/empty-state action already offers posting; do not cover empty copy. */}
      {shown.length > 0 && <button
        type="button"
        onClick={goPost}
        className="lg:hidden fixed bottom-[84px] left-4 z-30 inline-flex items-center gap-1.5 min-h-[50px] px-5 rounded-full bg-green text-white font-extrabold shadow-lg"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        أضف إعلان
      </button>}
    </section>
  );
}
