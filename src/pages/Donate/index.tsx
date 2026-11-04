// ─── باب الخير (/donate): causes and village organizations to give to
// The causes, their contacts and payment details live in src/config/donations.ts.
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  DONATION_CAUSES,
  DONATION_TYPES,
  donationWhatsappLink,
  hasPaymentDetails,
  type DonationCause,
} from "@/config/donations";
import { whatsappChatLink } from "@/config/developer";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useUIStore } from "@/stores/useUIStore";
import { DonationForm } from "./DonationForm";

const SUGGEST_MESSAGE =
  'السلام عليكم، أعرف جهة خير في القرية وعايزها تظهر في "باب الخير" في قريتي.\nاسم الجهة: \nالقرية: \nرقم المسؤول: ';

const STEPS = [
  {
    icon: "👆",
    title: "اختار باب الخير",
    text: "بيت المال، الجمعية، تجهيز عروسة، أو أي باب قلبك مرتاح له.",
  },
  {
    icon: "📝",
    title: "سيب بياناتك",
    text: "اسمك ورقمك، وهتتبرع بإيه: فلوس، هدوم، عفش، أو أكل.",
  },
  {
    icon: "📞",
    title: "هنكلمك",
    text: "نرتب معاك إزاي تبرعك يوصل، ولو حاجات بنعدّي نستلمها من عندك.",
  },
];

// ─── A copyable line of payment details (InstaPay, wallet, account number)
function CopyLine({ label, value }: { label: string; value: string }) {
  const showToast = useUIStore((state) => state.showToast);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      showToast("✅ اتنسخ");
    } catch {
      showToast("ماقدرناش ننسخ، انسخه بإيدك");
    }
  };
  return (
    <li className="flex items-center justify-between gap-2 bg-cream rounded-xl ps-3 pe-1 py-1">
      <span className="min-w-0 text-[13px]">
        <span className="text-text-muted">{label}: </span>
        <span className="font-extrabold break-all" dir="ltr">
          {value}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`انسخ ${label}`}
        className="shrink-0 min-h-[44px] min-w-[44px] px-2 rounded-lg text-green-dark font-bold text-xs cursor-pointer bg-transparent border-0 font-['Cairo',sans-serif]"
      >
        نسخ
      </button>
    </li>
  );
}

function PaymentDetails({ cause }: { cause: DonationCause }) {
  const p = cause.payment!;
  return (
    <div className="border-t border-[rgba(26,122,74,0.1)] pt-3">
      <p className="text-xs font-extrabold text-green-dark mb-2">
        حوّل لهم مباشرة:
      </p>
      <ul className="flex flex-col gap-1.5">
        {p.instapay && <CopyLine label="إنستاباي" value={p.instapay} />}
        {p.wallets?.map((w) => (
          <CopyLine key={w.name + w.number} label={w.name} value={w.number} />
        ))}
        {p.bank && (
          <>
            <CopyLine
              label={`${p.bank.bankName}، باسم ${p.bank.accountName}`}
              value={p.bank.accountNumber}
            />
            {p.bank.iban && <CopyLine label="IBAN" value={p.bank.iban} />}
          </>
        )}
      </ul>
    </div>
  );
}

// ─── One cause or organization
function CauseCard({
  cause,
  onDonate,
}: {
  cause: DonationCause;
  onDonate: (id: string) => void;
}) {
  return (
    <li className="bg-white rounded-2xl p-4 border border-[rgba(26,122,74,0.1)] shadow-card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          className="w-[46px] h-[46px] bg-cream rounded-xl flex items-center justify-center text-[24px] shrink-0"
          aria-hidden="true"
        >
          {cause.icon}
        </span>
        <div className="min-w-0">
          <h4 className="text-[0.9375rem] font-extrabold mb-1">{cause.name}</h4>
          <p className="text-[13px] text-text-muted leading-relaxed">
            {cause.description}
          </p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="تقدر تتبرع بـ">
        {cause.accepts.map((id) => {
          const t = DONATION_TYPES.find((x) => x.id === id)!;
          return (
            <li
              key={id}
              className="text-[11px] font-bold text-green-dark bg-[rgba(26,122,74,0.08)] rounded-full px-2.5 py-1"
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </li>
          );
        })}
      </ul>

      {(cause.contact?.name || cause.address) && (
        <p className="text-xs text-text-muted">
          {cause.contact?.name}
          {cause.contact?.name && cause.address ? " · " : ""}
          {cause.address && <span>📍 {cause.address}</span>}
        </p>
      )}

      {hasPaymentDetails(cause) && <PaymentDetails cause={cause} />}

      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => onDonate(cause.id)}
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-green text-white font-extrabold text-sm cursor-pointer font-['Cairo',sans-serif] transition-transform duration-200 hover:scale-[1.03]"
        >
          <span aria-hidden="true">🤲</span> عايز أتبرع
        </button>
        <a
          href={donationWhatsappLink(cause)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`اسأل عن ${cause.name} على واتساب (بيفتح في صفحة جديدة)`}
          title="اسأل على واتساب"
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#25D366] text-white"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </a>
      </div>
    </li>
  );
}

// ─── Page
export default function DonatePage() {
  const { hash } = useLocation();
  const [cause, setCause] = useState("");

  useEffect(() => {
    const previous = document.title;
    document.title = "باب الخير | قريتي";
    return () => {
      document.title = previous;
    };
  }, []);

  // /donate#form opens straight on the form
  useEffect(() => {
    if (hash !== "#form") return;
    const timer = window.setTimeout(() => {
      document
        .getElementById("form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [hash]);

  const openForm = (id: string) => {
    setCause(id);
    requestAnimationFrame(() => {
      document
        .getElementById("form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(
        () =>
          document.getElementById("donor-name")?.focus({ preventScroll: true }),
        400,
      );
    });
  };

  const organizations = DONATION_CAUSES.filter(
    (c) => c.kind === "organization",
  );
  const causes = DONATION_CAUSES.filter((c) => c.kind === "cause");

  return (
    <article className="max-w-[960px] mx-auto" aria-labelledby="donate-title">
      {/* Intro */}
      <header className="bg-linear-to-br from-green to-green-dark rounded-2xl p-6 md:p-10 text-white mb-6 relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div
            className="w-[60px] h-[60px] md:w-[76px] md:h-[76px] bg-gold rounded-2xl flex items-center justify-center text-[32px] md:text-[40px] shrink-0"
            aria-hidden="true"
          >
            🤲
          </div>
          <div>
            <h2
              id="donate-title"
              className="text-[clamp(1.5rem,4vw,2.25rem)] font-black font-['Tajawal',sans-serif] leading-tight"
            >
              باب الخير
            </h2>
            <p className="text-gold-light font-extrabold mt-1">
              خيرك يوصل لأهل قريتك
            </p>
            <p className="text-[clamp(0.9rem,2vw,1.0625rem)] text-white/90 mt-3 leading-relaxed max-w-[620px]">
              زكاة، صدقة، هدوم مش محتاجها، أو عفش لعروسة بتجهّز. اختار الباب
              اللي عايز تتبرع له، وسيب بياناتك، وإحنا نكلمك ونوصّل تبرعك لأصحابه
              في القرية.
            </p>
            <button
              type="button"
              onClick={() => openForm("")}
              className="mt-4 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-gold text-black font-extrabold text-[0.9375rem] cursor-pointer border-0 font-['Cairo',sans-serif] transition-transform duration-200 hover:scale-105"
            >
              عايز أتبرع ⬅️
            </button>
          </div>
        </div>
        <div
          className="absolute rounded-full pointer-events-none w-[180px] h-[180px] bg-[rgba(240,165,0,0.14)] -bottom-16 -left-12"
          aria-hidden="true"
        />
      </header>

      {/* Organizations */}
      <section className="mb-6" aria-labelledby="donate-orgs">
        <h3
          id="donate-orgs"
          className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-3.5 text-green-dark"
        >
          جهات الخير في القرية
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {organizations.map((c) => (
            <CauseCard key={c.id} cause={c} onDonate={openForm} />
          ))}
        </ul>
      </section>

      {/* Causes */}
      <section className="mb-6" aria-labelledby="donate-causes">
        <h3
          id="donate-causes"
          className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-3.5 text-green-dark"
        >
          أبواب الخير
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {causes.map((c) => (
            <CauseCard key={c.id} cause={c} onDonate={openForm} />
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section
        className="bg-green-dark rounded-3xl p-6 text-white mb-6"
        aria-labelledby="donate-steps"
      >
        <h3
          id="donate-steps"
          className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-4"
        >
          التبرع بيتم إزاي؟
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
                <p className="text-xs text-white/80 leading-relaxed">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-white/85 leading-relaxed mt-5 bg-white/10 rounded-xl p-3">
          <span aria-hidden="true">🛡️</span> التطبيق مش بياخد فلوس منك. متحوّلش
          لأي رقم غير اللي مكتوب في الصفحة دي، حتى لو حد كلمك باسم قريتي.
        </p>
      </section>

      {/* The form */}
      <section
        id="form"
        className="scroll-mt-24 bg-white rounded-2xl p-5 md:p-6 shadow-card border-2 border-gold-light mb-6"
        aria-labelledby="donate-form-title"
      >
        <h3
          id="donate-form-title"
          className="text-[clamp(1.125rem,2.5vw,1.375rem)] font-black mb-1 text-green-dark"
        >
          <span aria-hidden="true">🤲</span> عايز أتبرع
        </h3>
        <p className="text-sm text-text-muted leading-relaxed mb-4">
          سيب بياناتك وهنكلمك في أقرب وقت.
        </p>
        <DonationForm cause={cause} onCauseChange={setCause} />
      </section>

      {/* Suggest an organization */}
      <section className="bg-cream rounded-2xl p-5 md:p-6 border-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold mb-1">
            <span aria-hidden="true">🏡</span> تعرف جهة خير في قريتك؟
          </h3>
          <p className="text-[13px] text-text-muted leading-relaxed">
            لجنة زكاة، جمعية، أو مسجد بيجمع تبرعات؟ ابعتلنا اسمها ورقم المسؤول
            ونضيفها هنا.
          </p>
        </div>
        <a
          href={whatsappChatLink(SUGGEST_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="اقترح جهة خير على واتساب (بيفتح في صفحة جديدة)"
          className="shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#25D366] text-white font-extrabold text-[0.9375rem] transition-transform duration-200 hover:scale-105"
        >
          <WhatsAppIcon className="w-5 h-5" />
          ابعتلنا على واتساب
        </a>
      </section>
    </article>
  );
}
