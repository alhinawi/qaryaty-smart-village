// ─── عروض اليوم: live merchant offers with a countdown, auto-hide on expiry.
// Card art: style ٣ is the approved default; ?offers=1|2|all still previews the rest.
import { useEffect, useState } from 'react';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { offersRepo, type DailyOffer } from '@/repositories';
import { countdownText, isOfferActive } from '@/utils/countdown';

type OfferStyle = '1' | '2' | '3';

// ─── Card art: style ٣ (الكارت الأفقي بصورة المحل) is the approved default.
// The other two stay previewable with ?offers=1|2 (or =all to compare).
function readStyle(): OfferStyle | 'all' {
  const value = new URLSearchParams(window.location.search).get('offers');
  return value === '1' || value === '2' || value === 'all' ? value : '3';
}

/** Shop photo, or a gold initial when the shop has none. No emoji stand-ins. */
function ShopThumb({ offer, className }: { offer: DailyOffer; className: string }) {
  const [broken, setBroken] = useState(false);
  if (offer.shopPhoto && !broken) {
    return (
      <img
        src={offer.shopPhoto}
        alt={offer.shopName}
        loading="lazy"
        onError={() => setBroken(true)}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <span className={`${className} bg-gold-light text-green-dark flex items-center justify-center font-black`}>
      {offer.shopName.trim().charAt(0) || '؟'}
    </span>
  );
}

function CountdownChip({ endsAt, dark }: { endsAt: string; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black whitespace-nowrap ${
        dark ? 'bg-gold-light text-[#0f4f2e]' : 'bg-gold/15 text-[#8a6100]'
      }`}
    >
      ⏳ {countdownText(endsAt)}
    </span>
  );
}

// ─── Style 1: light card, photo on the side, gold countdown pill
function StyleOne({ offer }: { offer: DailyOffer }) {
  return (
    <div className="bg-white rounded-2xl border border-gold/40 shadow-sm p-3">
      <div className="flex items-center gap-3">
        <ShopThumb offer={offer} className="w-12 h-12 rounded-xl shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-text-muted m-0">{offer.shopName}</p>
          <h3 className="text-[15px] font-black text-green-dark leading-snug m-0 line-clamp-2">{offer.title}</h3>
        </div>
        <CountdownChip endsAt={offer.endsAt} />
      </div>
      {offer.details && <p className="text-[11px] text-text-muted leading-relaxed m-0 mt-1.5 line-clamp-2">{offer.details}</p>}
    </div>
  );
}

// ─── Style 2: full-width photo banner with a green gradient and gold chip
function StyleTwo({ offer }: { offer: DailyOffer }) {
  const [broken, setBroken] = useState(false);
  const showPhoto = offer.shopPhoto && !broken;
  return (
    <div className="relative rounded-2xl overflow-hidden h-32 bg-green-dark">
      {showPhoto && (
        <img
          src={offer.shopPhoto}
          alt={offer.shopName}
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-green-dark/95 via-green-dark/45 to-green-dark/10" />
      <div className="absolute top-2.5 start-2.5">
        <CountdownChip endsAt={offer.endsAt} dark />
      </div>
      <div className="absolute inset-x-3 bottom-2.5 text-white">
        <p className="text-[11px] font-bold opacity-85 m-0">{offer.shopName}</p>
        <h3 className="text-[16px] font-black leading-snug m-0">{offer.title}</h3>
        {offer.details && <p className="text-[11px] opacity-90 m-0 mt-0.5 line-clamp-1">{offer.details}</p>}
      </div>
    </div>
  );
}

// ─── Style 3: horizontal snap carousel, photo on top, body below
function StyleThree({ offers }: { offers: DailyOffer[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="snap-start shrink-0 w-56 bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
        >
          <div className="relative h-24 bg-gold-light/30">
            <ShopThumb offer={offer} className="w-full h-full rounded-none" />
            <div className="absolute bottom-2 start-2">
              <CountdownChip endsAt={offer.endsAt} dark />
            </div>
          </div>
          <div className="p-2.5">
            <h3 className="text-[13px] font-black text-green-dark leading-snug m-0 line-clamp-2">{offer.title}</h3>
            <p className="text-[11px] font-bold text-text-muted m-0 mt-1">{offer.shopName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OffersBlock({ offers, style }: { offers: DailyOffer[]; style: OfferStyle }) {
  if (style === '3') return <StyleThree offers={offers} />;
  return (
    <div className="flex flex-col gap-2.5">
      {offers.map((offer) => (style === '2' ? <StyleTwo key={offer.id} offer={offer} /> : <StyleOne key={offer.id} offer={offer} />))}
    </div>
  );
}

const STYLE_LABELS: Record<OfferStyle, string> = { '1': '١', '2': '٢', '3': '٣' };

export function DailyOffersSection() {
  const [offers, setOffers] = useState<DailyOffer[]>([]);
  const [style] = useState(readStyle);
  // Re-fetch when the demo switch flips; the verified snapshot also flips
  // false→true when the first successful settings read lands, so the sample
  // offer appears without waiting for the slow refresh
  const trackingDemo = useTrackingDemoMode();
  // A slow tick re-renders the countdown and drops expired offers
  const [, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      offersRepo
        .listActive()
        .then((list) => {
          if (alive) setOffers(list);
        })
        .catch(() => {
          /* no offers shown when the backend can't answer */
        });
    };
    refresh();
    const reloadTimer = setInterval(refresh, 5 * 60_000);
    const tickTimer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      alive = false;
      clearInterval(reloadTimer);
      clearInterval(tickTimer);
    };
  }, [trackingDemo]);

  const live = offers.filter((o) => isOfferActive(o.endsAt));
  if (live.length === 0) return null;

  const header = (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[17px] font-black text-green-dark m-0">🔥 عروض اليوم</h2>
      <span className="text-[12px] font-bold text-text-muted">لفترة محدودة</span>
    </div>
  );

  if (style === 'all') {
    return (
      <>
        {(Object.keys(STYLE_LABELS) as OfferStyle[]).map((s) => (
          <section key={s} className="mb-6" dir="rtl" aria-label={`عروض اليوم — شكل ${STYLE_LABELS[s]}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-green-dark text-gold-light text-[13px] font-black flex items-center justify-center">
                {STYLE_LABELS[s]}
              </span>
              <span className="text-[12px] font-bold text-text-muted">شكل {STYLE_LABELS[s]}</span>
            </div>
            <OffersBlock offers={live} style={s} />
          </section>
        ))}
      </>
    );
  }

  return (
    <section className="mb-6" dir="rtl" aria-label="عروض اليوم">
      {header}
      <OffersBlock offers={live} style={style} />
    </section>
  );
}
