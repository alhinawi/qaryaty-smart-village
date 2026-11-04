// ─── Imports
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ROUTES } from '@/routes';
import { DEVELOPER_NAME } from '@/components/layout/Footer';
import { DeveloperLinks } from '@/components/layout/DeveloperLinks';
import { ONLINE_PAYMENTS_ENABLED } from '@/services/payments';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { ADVERTISE_MESSAGE, DEVELOPER_PHONE_LINK, whatsappChatLink } from '@/config/developer';

// ─── Content
// Everything here describes what the app really has today. No made-up numbers.

interface OfferItem {
  icon: string;
  title: string;
  text: string;
}

const OFFERS: OfferItem[] = [
  {
    icon: '🛒',
    title: 'محلات القرية',
    text: 'سوبر ماركت، فرن، خضار وفاكهة، جزارة، فرارجي، سمك، ألبان، عطارة، بن، حلواني، مكتبة وأدوات منزلية. كل محل بأصنافه وأسعاره، وتملا سلتك وتطلب.',
  },
  {
    icon: '🍽️',
    title: 'مطاعم',
    text: 'منيو كامل بالأسعار لكل مطعم، وتقدر تفلتر بنوع الأكل: فول، كشري، شاورما، مشويات، فطير، سمك وحلويات.',
  },
  {
    icon: '💊',
    title: 'الصيدلية',
    text: 'دور على الدوا اللي محتاجه واطلبه من صيدلية القرية.',
  },
  {
    icon: '👩‍🏫',
    title: 'مدرسين',
    text: 'كل المواد، وتحفيظ قرآن، وكمبيوتر وبرمجة. حصة في البيت أو عند المدرس أو في سنتر أو أونلاين، ومواعيد المجموعات قدامك وتحجز مكانك.',
  },
  {
    icon: '🩺',
    title: 'صحة ورعاية',
    text: 'دكتور يكشف في البيت أو العيادة، وتمريض منزلي، وجليسة أطفال.',
  },
  {
    icon: '🔨',
    title: 'صنايعية وخدمات البيت',
    text: 'سباك، كهربائي، نجار، عامل أو عاملة نظافة، وغسيل ومكواة.',
  },
  {
    icon: '🧱',
    title: 'عمال التشطيب',
    text: 'نقاش، مبيض محارة، سيراميك، جبس بورد، ألوميتال ورخام، وكل أسطى معاه سعر المعاينة بتاعه.',
  },
  {
    icon: '🛵',
    title: 'توصيل ومشاوير',
    text: 'عيش من الفرن، أنبوبة بوتاجاز، توصيل المدرسة، ورمي الزبالة.',
  },
];

const STEPS: OfferItem[] = [
  {
    icon: '🔍',
    title: 'اختار',
    text: 'دور على الخدمة أو المحل أو الأكلة اللي عايزها.',
  },
  {
    icon: '🙋',
    title: 'اطلب أو احجز',
    text: 'احجز الشخص اللي تعرفه بالاسم، أو اطلب ونبعتلك أقرب حد متاح.',
  },
  {
    icon: ONLINE_PAYMENTS_ENABLED ? '💳' : '💵',
    title: 'ادفع زي ما تحب',
    text: ONLINE_PAYMENTS_ENABLED
      ? 'كاش عند الاستلام، أو أونلاين بالفيزا أو المحفظة.'
      : 'ادفع كاش عند الاستلام.',
  },
];

// ─── Component
export default function AboutPage() {
  const { hash } = useLocation();

  useEffect(() => {
    const previous = document.title;
    document.title = 'عن قريتي';
    return () => {
      document.title = previous;
    };
  }, []);

  // /about#advertise opens straight on the shop-owners section
  useEffect(() => {
    if (hash !== '#advertise') return;
    const timer = window.setTimeout(() => {
      document.getElementById('advertise')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <article className="max-w-[960px] mx-auto" aria-labelledby="about-title">
      {/* Intro */}
      <header className="bg-linear-to-br from-green to-green-dark rounded-2xl p-6 md:p-10 text-white mb-6 relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div
            className="w-[60px] h-[60px] md:w-[76px] md:h-[76px] bg-gold rounded-2xl flex items-center justify-center text-[32px] md:text-[40px] shrink-0"
            aria-hidden="true"
          >
            🏡
          </div>
          <div>
            <h2
              id="about-title"
              className="text-[clamp(1.5rem,4vw,2.25rem)] font-black font-['Tajawal',sans-serif] leading-tight"
            >
              عن قريتي
            </h2>
            <p className="text-gold-light font-extrabold mt-1">خدمات قريتك كلها في مكان واحد</p>
            <p className="text-[clamp(0.9rem,2vw,1.0625rem)] text-white/90 mt-3 leading-relaxed max-w-[620px]">
              قريتي بيجمع محلات القرية ومطاعمها وصنايعيتها ومدرسينها في تطبيق واحد. بدل ما تلف وتسأل، بتطلب أو
              تحجز من موبايلك، والطلب بيروح لناس من قريتك.
            </p>
          </div>
        </div>
        <div
          className="absolute rounded-full pointer-events-none w-[180px] h-[180px] bg-[rgba(240,165,0,0.14)] -bottom-16 -left-12"
          aria-hidden="true"
        />
      </header>

      {/* What you'll find */}
      <section className="mb-6" aria-labelledby="about-offers">
        <h3 id="about-offers" className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-3.5 text-green-dark">
          هتلاقي إيه في قريتي؟
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {OFFERS.map((item) => (
            <li
              key={item.title}
              className="bg-white rounded-2xl p-4 border border-[rgba(26,122,74,0.1)] shadow-card flex sm:flex-col gap-3"
            >
              <span
                className="w-[42px] h-[42px] bg-cream rounded-xl flex items-center justify-center text-[22px] shrink-0"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <div>
                <h4 className="text-[0.9375rem] font-extrabold mb-1">{item.title}</h4>
                <p className="text-[13px] text-text-muted leading-relaxed">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Book by name + your village */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6" aria-label="مميزات قريتي">
        <div className="bg-white rounded-2xl p-5 border-2 border-gold-light">
          <h3 className="text-base font-extrabold mb-1.5">
            <span aria-hidden="true">👤</span> احجز حد بالاسم
          </h3>
          <p className="text-[13px] text-text-muted leading-relaxed">
            تعرف مدرس أو أسطى أو ممرضة بعينها؟ اختارها بالاسم واحجزها. ولو مش فارق معاك مين، اطلب ونبعتلك أقرب حد
            متاح.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-2 border-gold-light">
          <h3 className="text-base font-extrabold mb-1.5">
            <span aria-hidden="true">📍</span> ناس من قريتك
          </h3>
          <p className="text-[13px] text-text-muted leading-relaxed">
            بتختار قريتك من قرى مركز المنصورة في الدقهلية، وبنعرضلك المدرسين والصنايعية اللي منها، ولو حابب تقدر
            تشوف القرى اللي جنبك كمان.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-green-dark rounded-3xl p-6 text-white mb-6" aria-labelledby="about-steps">
        <h3 id="about-steps" className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-4">
          بتشتغل إزاي؟
        </h3>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span
                className="w-[38px] h-[38px] bg-gold text-black rounded-xl flex items-center justify-center font-black shrink-0"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div>
                <h4 className="text-sm font-extrabold mb-1">
                  <span aria-hidden="true">{step.icon}</span> {step.title}
                </h4>
                <p className="text-xs text-white/80 leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Shop owners: list or advertise your shop */}
      <section
        id="advertise"
        className="scroll-mt-24 bg-cream rounded-2xl p-5 md:p-6 border-2 border-gold mb-6"
        aria-labelledby="about-advertise"
      >
        <h3 id="about-advertise" className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-2 text-green-dark">
          <span aria-hidden="true">🏪</span> عندك محل وعايز تعلن عنه في قريتي؟
        </h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-[640px]">
          لو عندك محل أو مطعم أو صيدلية، أو بتقدّم خدمة في القرية، وعايز أهل القرية يشوفوك ويطلبوا منك،
          تواصل معانا ونضيف محلك. ابعتلنا اسم المحل ونوعه والقرية.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <a
            href={whatsappChatLink(ADVERTISE_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="كلمنا على واتساب (بيفتح في صفحة جديدة)"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#25D366] text-white font-extrabold text-[0.9375rem] transition-transform duration-200 hover:scale-105"
          >
            <WhatsAppIcon className="w-5 h-5" />
            كلمنا على واتساب
          </a>
          <a
            href={DEVELOPER_PHONE_LINK}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-white text-green-dark border-2 border-green font-extrabold text-[0.9375rem] transition-transform duration-200 hover:scale-105"
          >
            <span aria-hidden="true">📞</span> اتصل بينا
          </a>
        </div>
      </section>

      {/* WhatsApp groups until launch */}
      <Link
        to={ROUTES.groups}
        className="flex items-center justify-between gap-3 bg-white rounded-2xl p-5 shadow-card mb-6 min-h-[44px] transition-colors hover:bg-cream"
      >
        <span className="flex items-center gap-3">
          <span className="w-[42px] h-[42px] bg-[#25D366] text-white rounded-xl flex items-center justify-center shrink-0">
            <WhatsAppIcon className="w-6 h-6" />
          </span>
          <span>
            <span className="block text-base font-extrabold text-green-dark">جروبات قريتي على واتساب</span>
            <span className="block text-[13px] text-text-muted">لحد ما نطلق المنصة، الخدمة شغالة من الجروبات</span>
          </span>
        </span>
        <span aria-hidden="true">⬅️</span>
      </Link>

      {/* Developer + call to action */}
      <section className="bg-white rounded-2xl p-5 md:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">تطوير وتصميم</p>
          <p className="text-lg font-black text-green-dark" dir="auto">
            {DEVELOPER_NAME}
          </p>
          <DeveloperLinks tone="onLight" className="mt-3" />
        </div>
        <Link
          to={ROUTES.home}
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-gold text-black font-extrabold text-[0.9375rem] transition-transform duration-200 hover:scale-105"
        >
          ابدأ اطلب دلوقتي ⬅️
        </Link>
      </section>
    </article>
  );
}
