// ─── Imports
import { useEffect } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/routes';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import {
  WHATSAPP_COMMUNITY,
  WHATSAPP_GROUPS,
  isWhatsAppInviteLink,
  type WhatsAppGroup,
} from '@/config/whatsappGroups';

// ─── Group card

function GroupCard({ group }: { group: WhatsAppGroup }) {
  const ready = isWhatsAppInviteLink(group.url);

  return (
    <li className="bg-white rounded-2xl p-4 border border-[rgba(26,122,74,0.1)] shadow-card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          className="w-[42px] h-[42px] bg-cream rounded-xl flex items-center justify-center text-[22px] shrink-0"
          aria-hidden="true"
        >
          {group.icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-extrabold mb-1">{group.name}</h3>
          <p className="text-[13px] text-text-muted leading-relaxed">{group.description}</p>
        </div>
      </div>
      {ready ? (
        <a
          href={group.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`انضم لجروب ${group.name} على واتساب (بيفتح في صفحة جديدة)`}
          className="mt-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#25D366] text-white font-extrabold text-sm transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
        >
          <WhatsAppIcon className="w-5 h-5" />
          انضم للجروب
        </a>
      ) : (
        <span className="mt-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-gray-100 text-text-muted font-bold text-sm">
          <span aria-hidden="true">⏳</span> الرابط قريبًا
        </span>
      )}
    </li>
  );
}

// ─── Page

export default function GroupsPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'جروبات قريتي على واتساب';
    return () => {
      document.title = previous;
    };
  }, []);

  const communityReady = isWhatsAppInviteLink(WHATSAPP_COMMUNITY.url);

  return (
    <article className="max-w-[960px] mx-auto" aria-labelledby="groups-title">
      {/* Intro */}
      <header className="bg-linear-to-br from-green to-green-dark rounded-2xl p-6 md:p-10 text-white mb-6 relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div
            className="w-[60px] h-[60px] md:w-[76px] md:h-[76px] bg-[#25D366] rounded-2xl flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <WhatsAppIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h2
              id="groups-title"
              className="text-[clamp(1.5rem,4vw,2.25rem)] font-black font-['Tajawal',sans-serif] leading-tight"
            >
              جروبات قريتي على واتساب
            </h2>
            <p className="text-gold-light font-extrabold mt-1">نبدأ من واتساب لحد ما نطلق المنصة</p>
            <p className="text-[clamp(0.9rem,2vw,1.0625rem)] text-white/90 mt-3 leading-relaxed max-w-[620px]">
              لحد ما قريتي ينزل رسميًا، الخدمة شغالة من مجتمع "قريتي" على واتساب. فيه جروب لكل خدمة،
              ادخل الجروب اللي يهمك واطلب أو اعرض منه. وجروب الإعلانات هيوصلك فيه كل جديد.
            </p>
            {communityReady ? (
              <a
                href={WHATSAPP_COMMUNITY.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`انضم لـ${WHATSAPP_COMMUNITY.name} على واتساب (بيفتح في صفحة جديدة)`}
                className="mt-4 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-gold text-black font-extrabold text-[0.9375rem] transition-transform duration-200 hover:scale-105"
              >
                <WhatsAppIcon className="w-5 h-5" />
                انضم لـ{WHATSAPP_COMMUNITY.name}
              </a>
            ) : (
              <p className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white/15 text-white font-bold text-sm">
                <span aria-hidden="true">⏳</span> رابط المجتمع هينزل هنا قريب
              </p>
            )}
          </div>
        </div>
        <div
          className="absolute rounded-full pointer-events-none w-[180px] h-[180px] bg-[rgba(240,165,0,0.14)] -bottom-16 -left-12"
          aria-hidden="true"
        />
      </header>

      {/* Groups */}
      <section className="mb-6" aria-labelledby="groups-list">
        <h3 id="groups-list" className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-3.5 text-green-dark">
          الجروبات
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WHATSAPP_GROUPS.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </ul>
      </section>

      {/* Shop owners */}
      <section className="bg-white rounded-2xl p-5 md:p-6 shadow-card border-2 border-gold-light flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold mb-1">
            <span aria-hidden="true">🏪</span> عندك محل وعايز تعلن عنه؟
          </h3>
          <p className="text-[13px] text-text-muted leading-relaxed">كلمنا ونضيف محلك في الجروبات وفي المنصة.</p>
        </div>
        <Link
          to={`${ROUTES.about}#advertise`}
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-green text-white font-extrabold text-[0.9375rem] transition-transform duration-200 hover:scale-105"
        >
          تواصل معانا ⬅️
        </Link>
      </section>
    </article>
  );
}
