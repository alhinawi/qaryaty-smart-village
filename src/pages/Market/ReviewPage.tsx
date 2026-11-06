// ─── /market/review (admins): posts hidden after 3 reports — put back or delete
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { marketRepo, type MarketListing } from '@/repositories';
import { KIND_INFO, categoryIcon, timeAgo } from '@/config/market';
import { ROUTES, marketItemPath } from '@/routes';
import { useAuthStore, selectCanReview } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackBar, PhotoBox, PriceLine, usePageTitle } from './shared';

export default function MarketReviewPage() {
  const canReview = useAuthStore(selectCanReview);
  const showToast = useUIStore((s) => s.showToast);
  const ask = useConfirmStore((s) => s.ask);
  usePageTitle('بلاغات المستعمل والتبادل • قريتي');
  const [items, setItems] = useState<MarketListing[] | null>(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!canReview) return;
    let alive = true;
    Promise.all([marketRepo.list('sale', { hidden: true }), marketRepo.list('swap', { hidden: true })])
      .then(([a, b]) => alive && setItems([...a, ...b].sort((x, y) => y.createdAt.localeCompare(x.createdAt))))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [canReview]);

  if (!canReview) return <Navigate to={ROUTES.home} replace />;

  const restore = async (l: MarketListing) => {
    setBusy(l.id);
    try {
      await marketRepo.setStatus(l.id, 'active');
      setItems((list) => (list ?? []).filter((x) => x.id !== l.id));
      showToast('الإعلان اتنشر تاني والبلاغات اتمسحت');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'حصلت مشكلة');
    } finally {
      setBusy('');
    }
  };
  const remove = async (l: MarketListing) => {
    if (!(await ask({ title: 'تمسح الإعلان؟', message: l.title, confirmLabel: 'امسح', cancelLabel: 'رجوع' }))) return;
    setBusy(l.id);
    try {
      await marketRepo.remove(l);
      setItems((list) => (list ?? []).filter((x) => x.id !== l.id));
      showToast('الإعلان اتمسح');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'حصلت مشكلة');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="max-w-[720px] mx-auto pb-10">
      <BackBar title="بلاغات المستعمل والتبادل" />
      {items === null ? (
        <p className="bg-white rounded-2xl p-6 text-center shadow-card">بيحمّل…</p>
      ) : items.length === 0 ? (
        <EmptyState emoji="✅" title="مفيش بلاغات" description="مفيش إعلانات محتاجة مراجعة دلوقتي." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((l) => (
            <li key={l.id} className="bg-white rounded-2xl p-3 shadow-card">
              <Link to={marketItemPath(l.id)} className="flex items-center gap-3">
                <PhotoBox src={l.photos[0]} alt="" icon={categoryIcon(l.category)} className="w-16 h-16 rounded-xl shrink-0 text-[26px]" />
                <div className="min-w-0">
                  <p className="font-extrabold text-sm truncate">
                    {KIND_INFO[l.kind].icon} {l.title}
                  </p>
                  <PriceLine listing={l} />
                  <p className="text-[12px] text-text-muted">
                    {l.ownerName} • {l.village} • {timeAgo(l.createdAt)} • {l.reportsCount} بلاغات
                  </p>
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button type="button" variant="success" size="sm" disabled={busy === l.id} onClick={() => restore(l)}>
                  انشره تاني
                </Button>
                <Button type="button" variant="danger" size="sm" disabled={busy === l.id} onClick={() => remove(l)}>
                  امسح
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
