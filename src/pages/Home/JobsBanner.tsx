// ─── وظائف on the home page: a way in to /jobs
import { Link } from 'react-router';
import { ROUTES } from '@/routes';

export function JobsBanner() {
  return (
    <section
      className="mb-6 bg-white rounded-2xl p-4 border-2 border-green/25 shadow-card flex items-center gap-3"
      aria-labelledby="home-jobs-title"
    >
      <span
        className="w-[48px] h-[48px] bg-cream border border-green/25 rounded-2xl flex items-center justify-center text-[26px] shrink-0"
        aria-hidden="true"
      >
        💼
      </span>
      <div className="flex-1 min-w-0">
        <h3 id="home-jobs-title" className="text-[clamp(1rem,2.5vw,1.2rem)] font-black text-green-dark m-0">
          وظائف
        </h3>
        <p className="text-[13px] text-text-muted leading-relaxed m-0">
          دوّر على شغل في قريتك، أو نزّل إعلان لو محتاج حد يشتغل معاك.
        </p>
      </div>
      <Link
        to={ROUTES.jobs}
        className="shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-green text-white font-extrabold text-sm"
      >
        شوف الوظائف ⬅️
      </Link>
    </section>
  );
}
