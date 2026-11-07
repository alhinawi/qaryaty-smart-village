// One market entry; existing sale/swap URLs keep selecting the corresponding section.
import { Link } from 'react-router';
import { ROUTES } from '@/routes';

export function MarketBanner() {
  return <section className="mb-6" aria-labelledby="home-market-title">
    <h2 id="home-market-title" className="text-[clamp(1rem,2.5vw,1.2rem)] font-black text-green-dark mb-2">بيع وتبادل المستعمل</h2>
    <Link to={ROUTES.marketSale} className="bg-white rounded-2xl p-4 border-2 border-green/25 shadow-card flex items-center gap-3 transition-colors hover:bg-green/5">
      <span className="w-12 h-12 bg-green rounded-xl flex items-center justify-center text-2xl shrink-0" aria-hidden="true">♻️</span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-base text-green-dark">المستعمل والتبادل</span>
        <span className="block text-[13px] text-text-muted leading-relaxed mt-1">اشتري أو بيع حاجة مستعملة، أو اختار التبادل جوّه القسم.</span>
        <span className="block text-[13px] font-extrabold text-green mt-2">شوف المعروض ←</span>
      </span>
    </Link>
  </section>;
}
