// ─── شير مواصلة on the home page: a way in to /rides, one tile for each kind of trip
import { Link } from 'react-router';
import { ROUTES } from '@/routes';
import { RIDE_KINDS } from '@/config/rides';

export function RidesBanner() {
  return (
    <section className="mb-6" aria-labelledby="home-rides-title">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 id="home-rides-title" className="text-[clamp(1rem,2.5vw,1.2rem)] font-black text-green-dark m-0">
          شير مواصلة
        </h3>
        <Link to={ROUTES.rides} className="text-[13px] font-extrabold text-green min-h-[44px] inline-flex items-center">
          كل المشاوير ⬅️
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 list-none p-0 m-0">
        {RIDE_KINDS.map((k) => (
          <li key={k.id}>
            <Link
              to={ROUTES.rides}
              className="h-full bg-white rounded-2xl p-3 border-2 border-green/25 shadow-card flex flex-col gap-2 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-[40px] h-[40px] bg-green rounded-xl flex items-center justify-center text-[22px] shrink-0"
                  aria-hidden="true"
                >
                  {k.icon}
                </span>
                <span className="font-black text-[15px] text-green-dark">{k.label}</span>
              </span>
              <span className="text-[12.5px] text-text-muted leading-relaxed flex-1">{k.hint}</span>
              <span className="text-[13px] font-extrabold text-green">شوف المشاوير ⬅️</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
