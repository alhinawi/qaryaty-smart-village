// ─── بيع المستعمل وتبادل: pieces the market pages share
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { setMarketUser, type MarketListing } from '@/repositories';
import {
  KIND_INFO,
  MARKET_SAFETY_TIPS,
  categoryIcon,
  conditionLabel,
  formatPrice,
  timeAgo,
} from '@/config/market';
import { marketItemPath } from '@/routes';

/** The signed-in person (or null); also tells the demo repository who it is. */
export function useMarketUser() {
  const user = useAuthStore((s) => s.session?.user ?? null);
  setMarketUser(user ? { id: user.id, name: user.name } : null);
  return user;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/** Short village name for a card: "منية سندوب، مركز …" → "منية سندوب" */
export function shortVillage(village: string): string {
  return village.split(/[،,–-]/)[0].trim() || village;
}

export function BackBar({ title, to }: { title: string; to?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        type="button"
        onClick={() => (to ? navigate(to) : window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center text-green-dark shrink-0"
        aria-label="رجوع"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
      <h2 className="text-[1.25rem] font-black text-green-dark truncate">{title}</h2>
    </div>
  );
}

export function SafetyNote({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className={`bg-[#fff8e6] border border-gold-light rounded-2xl ${compact ? 'p-3' : 'p-4'} text-[13px] leading-relaxed`}
      aria-label="نصايح للأمان"
    >
      <p className="font-extrabold text-[#8a5a00] flex items-center gap-1.5 mb-1">
        <ShieldCheck className="w-4 h-4" aria-hidden="true" /> علشان تبقى في الأمان
      </p>
      <ul className="list-disc pr-5 text-text-muted space-y-0.5">
        {MARKET_SAFETY_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </aside>
  );
}

export function PhotoBox({ src, alt, icon, className = '' }: { src?: string; alt: string; icon: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`bg-cream flex items-center justify-center text-[40px] ${className}`} aria-hidden="true">
        {icon}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

export function PriceLine({ listing }: { listing: MarketListing }) {
  if (listing.kind === 'sale' && listing.price != null) {
    return (
      <p className="text-green font-black text-[0.9375rem]">
        {formatPrice(listing.price)}
        {listing.negotiable && <span className="text-[11px] font-bold text-text-muted mr-1.5">قابل للتفاوض</span>}
      </p>
    );
  }
  return (
    <p className="text-[13px] font-bold text-green-dark line-clamp-1">
      <span aria-hidden="true">🔄 </span>عايز بدالها: {listing.wanted}
    </p>
  );
}

export function ListingCard({ listing, badge }: { listing: MarketListing; badge?: string }) {
  return (
    <li>
      <Link
        to={marketItemPath(listing.id)}
        className="block bg-white rounded-2xl overflow-hidden shadow-card border border-[rgba(26,122,74,0.08)] h-full focus-visible:outline-2 focus-visible:outline-green"
      >
        <div className="relative">
          <PhotoBox src={listing.photos[0]} alt={listing.title} icon={categoryIcon(listing.category)} className="w-full aspect-[4/3]" />
          <span className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-0.5 text-[11px] font-extrabold text-green-dark">
            {conditionLabel(listing.condition)}
          </span>
          {listing.photos.length > 1 && (
            <span className="absolute bottom-2 left-2 bg-black/55 text-white rounded-full px-2 py-0.5 text-[11px] font-bold">
              📷 {listing.photos.length}
            </span>
          )}
          {badge && (
            <span className="absolute top-2 left-2 bg-green text-white rounded-full px-2 py-0.5 text-[11px] font-extrabold">{badge}</span>
          )}
        </div>
        <div className="p-3 flex flex-col gap-1">
          <h3 className="font-extrabold text-[0.9375rem] line-clamp-1">{listing.title}</h3>
          <PriceLine listing={listing} />
          <p className="text-[12px] text-text-muted line-clamp-1">
            📍 {shortVillage(listing.village)} • {timeAgo(listing.createdAt)}
          </p>
        </div>
      </Link>
    </li>
  );
}

export function KindSwitch({ kind }: { kind: 'sale' | 'swap' }) {
  return (
    <div className="grid grid-cols-2 bg-white rounded-2xl p-1 shadow-card mb-4" role="tablist" aria-label="نوع الإعلانات">
      {(['sale', 'swap'] as const).map((k) => (
        <Link
          key={k}
          to={k === 'sale' ? '/market/sale' : '/market/swap'}
          replace
          role="tab"
          aria-selected={k === kind}
          className={`min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-sm transition-colors ${
            k === kind ? 'bg-green text-white' : 'text-green-dark'
          }`}
        >
          <span aria-hidden="true">{KIND_INFO[k].icon}</span>
          {k === 'sale' ? 'بيع وشراء' : KIND_INFO[k].title}
        </Link>
      ))}
    </div>
  );
}
