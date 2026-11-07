import { HandHeart } from 'lucide-react';
// ─── باب الخير on the home page: a way in to /donate
import { Link } from "react-router";
import { ROUTES } from "@/routes";

const HIGHLIGHTS = [
  "🕌 بيت المال",
  "🤝 الجمعية الشرعية",
  "👰 تجهيز عرايس",
  "🧒 كفالة يتيم",
];

export function DonationsBanner() {
  return (
    <section
      className="mb-6 bg-white rounded-2xl p-5 border-2 border-gold-light shadow-card flex flex-col md:flex-row md:items-center gap-4"
      aria-labelledby="home-donate-title"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span
          className="w-[52px] h-[52px] bg-gold rounded-2xl flex items-center justify-center text-[28px] shrink-0"
          aria-hidden="true"
        >
          🤲
        </span>
        <div className="min-w-0">
          <h3
            id="home-donate-title"
            className="text-[clamp(1rem,2.5vw,1.25rem)] font-black text-green-dark mb-1"
          >
            باب الخير
          </h3>
          <p className="text-[13px] text-text-muted leading-relaxed">
            اتبرع لأهل قريتك بفلوس أو هدوم أو عفش أو أكل، وإحنا نوصّله لأصحابه.
          </p>
          <ul
            className="flex flex-wrap gap-1.5 mt-2"
            aria-label="من أبواب الخير"
          >
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="text-[11px] font-bold text-green-dark bg-cream rounded-full px-2.5 py-1"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Link
        to={ROUTES.donate}
        className="shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-green text-white font-extrabold text-[0.9375rem] transition-transform duration-200 hover:scale-105"
      >
        اتبرع دلوقتي <HandHeart size={19} aria-hidden="true" />
      </Link>
    </section>
  );
}
