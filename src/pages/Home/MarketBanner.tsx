// ─── بيع المستعمل وتبادل on the home page: one tile for each service
import { Link } from 'react-router';
import { KIND_INFO } from '@/config/market';
import { marketListPath } from '@/routes';
import type { ListingKind } from '@/repositories/market/types';

const KINDS: { kind: ListingKind; action: string }[] = [
  { kind: 'sale', action: 'شوف المعروض ⬅️' },
  { kind: 'swap', action: 'شوف التبادل ⬅️' },
];

export function MarketBanner() {
  return (
    <section className="mb-6" aria-labelledby="home-market-title">
      <h3 id="home-market-title" className="text-[clamp(1rem,2.5vw,1.2rem)] font-black text-green-dark mb-2">
        بيع وتبادل المستعمل
      </h3>
      <ul className="grid grid-cols-2 gap-3 list-none p-0 m-0">
        {KINDS.map(({ kind, action }) => {
          const info = KIND_INFO[kind];
          return (
            <li key={kind}>
              <Link
                to={marketListPath(kind)}
                className="h-full bg-white rounded-2xl p-3 border-2 border-green/25 shadow-card flex flex-col gap-2 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-[40px] h-[40px] bg-green rounded-xl flex items-center justify-center text-[22px] shrink-0"
                    aria-hidden="true"
                  >
                    {info.icon}
                  </span>
                  <span className="font-black text-[15px] text-green-dark">{info.title}</span>
                </span>
                <span className="text-[12.5px] text-text-muted leading-relaxed flex-1">{info.tagline}</span>
                <span className="text-[13px] font-extrabold text-green">{action}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
