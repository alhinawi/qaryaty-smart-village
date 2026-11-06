// ─── /market/item/:id: one post with its photos, contact buttons, report, and owner tools
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Flag, MessageCircle, Pencil, Phone, RefreshCw, Trash2 } from 'lucide-react';
import { marketRepo, type ListingReportReason, type MarketListing } from '@/repositories';
import {
  KIND_INFO,
  LISTING_REPORT_REASONS,
  canRenew,
  categoryIcon,
  categoryLabel,
  conditionLabel,
  isLive,
  listingWhatsappLink,
  ownerStatusLabel,
  timeAgo,
} from '@/config/market';
import { ROUTES, marketChatPath, marketEditPath, marketListPath } from '@/routes';
import { useUIStore } from '@/stores/useUIStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { BackBar, PhotoBox, PriceLine, SafetyNote, useMarketUser, usePageTitle } from './shared';

function ReportModal({ listing, onClose }: { listing: MarketListing; onClose: () => void }) {
  const [reason, setReason] = useState<ListingReportReason | ''>('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const showToast = useUIStore((s) => s.showToast);
  const submit = async () => {
    if (!reason) {
      setError('اختار السبب');
      return;
    }
    setSending(true);
    try {
      await marketRepo.report(listing.id, reason, note);
      showToast('شكرًا، البلاغ وصل وهنراجعه');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حصلت مشكلة، جرّب تاني');
    } finally {
      setSending(false);
    }
  };
  return (
    <Modal isOpen onClose={onClose} title="بلّغ عن الإعلان" emoji="🚩">
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="سبب البلاغ">
        {LISTING_REPORT_REASONS.map((r) => (
          <label key={r.id} className={`flex items-center gap-2 min-h-[44px] px-3 rounded-xl border cursor-pointer ${reason === r.id ? 'border-green bg-[#f3faf6]' : 'border-black/10'}`}>
            <input type="radio" name="report-reason" checked={reason === r.id} onChange={() => setReason(r.id)} className="accent-green w-4 h-4" />
            <span className="text-sm font-bold">{r.label}</span>
          </label>
        ))}
        <textarea
          rows={2}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="تفاصيل (اختياري)"
          aria-label="تفاصيل البلاغ"
          className="q-input mt-1"
        />
        {error && (
          <p className="text-red-600 text-sm font-bold" role="alert">
            {error}
          </p>
        )}
        <Button type="button" variant="danger" onClick={submit} disabled={sending} className="w-full mt-1">
          {sending ? 'ثانية…' : 'ابعت البلاغ'}
        </Button>
      </div>
    </Modal>
  );
}

export default function MarketItemPage() {
  const { id = '' } = useParams();
  const user = useMarketUser();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const ask = useConfirmStore((s) => s.ask);
  const [listing, setListing] = useState<MarketListing | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  usePageTitle(listing ? `${listing.title} • قريتي` : 'إعلان • قريتي');

  useEffect(() => {
    let alive = true;
    marketRepo
      .get(id)
      .then((l) => {
        if (!alive) return;
        setError('');
        setListing(l);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'حصلت مشكلة'));
    return () => {
      alive = false;
    };
  }, [id, reload, user?.id]);

  if (error) {
    return (
      <section className="max-w-[720px] mx-auto">
        <BackBar title="الإعلان" />
        <div className="bg-white rounded-2xl p-6 text-center shadow-card">
          <p className="mb-3">{error}</p>
          <Button
            onClick={() => {
              setError('');
              setReload((n) => n + 1);
            }}
          >جرّب تاني</Button>
        </div>
      </section>
    );
  }
  if (listing === undefined) {
    return (
      <section className="max-w-[720px] mx-auto" aria-busy="true">
        <BackBar title="الإعلان" />
        <div className="bg-white rounded-2xl aspect-[4/3] animate-pulse" />
      </section>
    );
  }
  if (listing === null) {
    return (
      <section className="max-w-[720px] mx-auto">
        <BackBar title="الإعلان" />
        <div className="bg-white rounded-2xl p-6 text-center shadow-card">
          <p className="text-[40px] mb-2" aria-hidden="true">
            📦
          </p>
          <p className="font-extrabold mb-1">الإعلان ده مبقاش موجود</p>
          <p className="text-sm text-text-muted mb-4">يمكن اتباع أو اتبدّل أو صاحبه شاله.</p>
          <Link to={ROUTES.marketSale} className="text-green font-extrabold">
            شوف إعلانات تانية
          </Link>
        </div>
      </section>
    );
  }

  const info = KIND_INFO[listing.kind];
  const mine = user?.id === listing.ownerId;
  const live = isLive(listing);
  const needLogin = (to: string) => navigate(ROUTES.login, { state: { from: to } });

  const act = async (fn: () => Promise<MarketListing | void>, done: string) => {
    setBusy(true);
    try {
      const next = await fn();
      if (next) setListing(next);
      showToast(done);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'حصلت مشكلة، جرّب تاني');
    } finally {
      setBusy(false);
    }
  };

  const markDone = async () => {
    const ok = await ask({
      title: listing.kind === 'sale' ? 'اتباعت؟' : 'اتبدّلت؟',
      message: 'الإعلان هيختفي من القايمة، وتقدر ترجّعه من هنا لو الموضوع ماتمّش.',
      confirmLabel: 'أيوة',
      cancelLabel: 'لأ',
    });
    if (ok) await act(() => marketRepo.setStatus(listing.id, listing.kind === 'sale' ? 'sold' : 'swapped'), 'مبروك 🎉');
  };

  const remove = async () => {
    const ok = await ask({
      title: 'تمسح الإعلان؟',
      message: 'الإعلان وصوره ورسايله هتتمسح خالص.',
      confirmLabel: 'امسح',
      cancelLabel: 'رجوع',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await marketRepo.remove(listing);
      showToast('الإعلان اتمسح');
      navigate(ROUTES.marketMine, { replace: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'حصلت مشكلة، جرّب تاني');
      setBusy(false);
    }
  };

  return (
    <article className="max-w-[720px] mx-auto pb-10">
      <BackBar title={info.title} to={marketListPath(listing.kind)} />

      {/* Photos */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-card mb-3">
        <div className="relative">
          <PhotoBox src={listing.photos[photo]} alt={listing.title} icon={categoryIcon(listing.category)} className="w-full aspect-[4/3] bg-black/5" />
          {!live && (
            <span className="absolute top-3 right-3 bg-black/70 text-white rounded-full px-3 py-1 text-[12px] font-extrabold">
              {ownerStatusLabel(listing)}
            </span>
          )}
        </div>
        {listing.photos.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto">
            {listing.photos.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setPhoto(i)}
                aria-label={`صورة ${i + 1}`}
                aria-pressed={photo === i}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${photo === i ? 'border-green' : 'border-transparent'}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <section className="bg-white rounded-2xl p-4 shadow-card mb-3">
        <h2 className="text-[1.25rem] font-black mb-1">{listing.title}</h2>
        <div className="text-[1.0625rem]">
          <PriceLine listing={listing} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 text-[13px]">
          <div>
            <dt className="text-text-muted">القسم</dt>
            <dd className="font-bold">
              {categoryIcon(listing.category)} {categoryLabel(listing.category)}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">الحالة</dt>
            <dd className="font-bold">{conditionLabel(listing.condition)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-text-muted">المكان</dt>
            <dd className="font-bold">📍 {listing.village}</dd>
          </div>
          <div>
            <dt className="text-text-muted">صاحب الإعلان</dt>
            <dd className="font-bold">{listing.ownerName || 'من أهل القرية'}</dd>
          </div>
          <div>
            <dt className="text-text-muted">اتنشر</dt>
            <dd className="font-bold">{timeAgo(listing.createdAt)}</dd>
          </div>
        </dl>
        {listing.kind === 'swap' && (
          <p className="mt-3 bg-[#f3faf6] rounded-xl p-3 text-sm">
            <span className="font-extrabold text-green-dark">🔄 عايز بدالها: </span>
            {listing.wanted}
          </p>
        )}
        {listing.description && <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>}
      </section>

      {mine ? (
        <section className="bg-white rounded-2xl p-4 shadow-card mb-3 flex flex-col gap-2" aria-label="إدارة إعلانك">
          <p className="text-sm font-extrabold text-green-dark">ده إعلانك • {ownerStatusLabel(listing)}</p>
          {listing.status === 'hidden' && (
            <p className="text-[13px] text-text-muted">ناس بلّغوا عن الإعلان ده، فاتخبّى لحد ما الإدارة تراجعه.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {listing.status === 'active' && (
              <Button type="button" variant="success" disabled={busy} onClick={markDone}>
                {info.doneAction}
              </Button>
            )}
            {(listing.status === 'sold' || listing.status === 'swapped') && (
              <Button type="button" variant="outline" disabled={busy} onClick={() => act(() => marketRepo.setStatus(listing.id, 'active'), 'الإعلان رجع تاني')}>
                رجّعه منشور
              </Button>
            )}
            {canRenew(listing) && (
              <Button type="button" variant="gold" disabled={busy} onClick={() => act(() => marketRepo.renew(listing.id), 'اتجدّد 30 يوم')}>
                <RefreshCw className="w-4 h-4" aria-hidden="true" /> جدّد 30 يوم
              </Button>
            )}
            {listing.status !== 'hidden' && (
              <Button type="button" variant="outline" disabled={busy} onClick={() => navigate(marketEditPath(listing.id))}>
                <Pencil className="w-4 h-4" aria-hidden="true" /> عدّل
              </Button>
            )}
            <Button type="button" variant="danger" disabled={busy} onClick={remove}>
              <Trash2 className="w-4 h-4" aria-hidden="true" /> امسح
            </Button>
          </div>
          <Link to={ROUTES.marketMine} className="text-[13px] font-extrabold text-green mt-1">
            💬 رسايل إعلاناتي
          </Link>
        </section>
      ) : live ? (
        <section className="bg-white rounded-2xl p-4 shadow-card mb-3 flex flex-col gap-2" aria-label="اتواصل مع صاحب الإعلان">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => {
              if (!user) return needLogin(`/market/item/${listing.id}`);
              navigate(marketChatPath(listing.id, user.id));
            }}
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" /> ابعت رسالة
          </Button>
          {listing.contactPhone && (
            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${listing.contactPhone}`} className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl border-2 border-green text-green font-extrabold text-sm">
                <Phone className="w-4 h-4" aria-hidden="true" /> اتصل
              </a>
              <a
                href={listingWhatsappLink(listing.contactPhone, listing)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl bg-[#25D366] text-white font-extrabold text-sm"
              >
                <WhatsAppIcon className="w-4 h-4" /> واتساب
              </a>
            </div>
          )}
        </section>
      ) : null}

      <SafetyNote />

      {!mine && live && (
        <button
          type="button"
          onClick={() => (user ? setReporting(true) : needLogin(`/market/item/${listing.id}`))}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-red-600"
        >
          <Flag className="w-4 h-4" aria-hidden="true" /> بلّغ عن الإعلان
        </button>
      )}
      {reporting && <ReportModal listing={listing} onClose={() => setReporting(false)} />}
    </article>
  );
}
