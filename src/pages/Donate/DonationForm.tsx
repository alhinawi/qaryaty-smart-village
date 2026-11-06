// ─── "عايز أتبرع" form: saved in Supabase (donation_requests), with WhatsApp as a backup
import { useState } from "react";
import {
  DONATION_CAUSES,
  DONATION_TYPES,
  donationTypesFor,
  donationWhatsappLink,
  findCause,
  type DonationType,
} from "@/config/donations";
import { donationFormSchema } from "@/utils/donationForm";
import { fieldErrorsFrom } from "@/utils/validators";
import { RepoError, submitDonationRequest } from "@/repositories";
import { useAuthStore } from "@/stores/useAuthStore";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface DonationFormProps {
  cause: string;
  onCauseChange: (id: string) => void;
}

type Sent = {
  name: string;
  causeName: string;
  type: DonationType;
  notes: string;
  causeId: string;
};

export function DonationForm({ cause, onCauseChange }: DonationFormProps) {
  const user = useAuthStore((state) => state.session?.user);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [type, setType] = useState<DonationType | "">("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);

  const selected = findCause(cause);
  const types = donationTypesFor(selected);
  // A type the newly picked cause doesn't take is cleared
  const currentType = type && types.includes(type) ? type : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSubmitError("");
    const parsed = donationFormSchema.safeParse({
      name,
      phone,
      cause,
      type: currentType,
      notes,
    });
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error.issues));
      return;
    }
    setErrors({});
    const data = parsed.data;
    const causeName = findCause(data.cause)!.name;
    setSending(true);
    try {
      await submitDonationRequest({ ...data, causeName });
      setSent({
        name: data.name,
        causeName,
        type: data.type,
        notes: data.notes,
        causeId: data.cause,
      });
    } catch (error) {
      setSubmitError(
        error instanceof RepoError
          ? error.message
          : "حصلت مشكلة وطلبك ماتبعتش. جرّب تاني أو ابعتلنا على واتساب.",
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    const sentCause = findCause(sent.causeId)!;
    return (
      <div className="text-center py-4" role="status">
        <div className="text-[44px] mb-2" aria-hidden="true">
          🤲
        </div>
        <h4 className="text-lg font-black text-green-dark mb-1.5">
          جزاك الله خير يا {sent.name}
        </h4>
        <p className="text-sm text-text-muted leading-relaxed max-w-[420px] mx-auto">
          طلبك لـ"{sent.causeName}" وصلنا، وهنكلمك على رقمك نرتب معاك إزاي تبرعك
          يوصل لأصحابه. لو مستعجل، ابعتلنا رسالة على واتساب.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-4">
          <a
            href={donationWhatsappLink(sentCause, {
              name: sent.name,
              type: sent.type,
              notes: sent.notes,
            })}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ابعت الطلب على واتساب كمان (بيفتح في صفحة جديدة)"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#25D366] text-white font-extrabold text-[0.9375rem]"
          >
            <WhatsAppIcon className="w-5 h-5" />
            ابعته على واتساب كمان
          </a>
          <button
            type="button"
            onClick={() => {
              setSent(null);
              setType("");
              setNotes("");
            }}
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-white text-green-dark border-2 border-green font-extrabold text-[0.9375rem] cursor-pointer font-['Cairo',sans-serif]"
          >
            تبرع تاني
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="donor-name">اسمك</label>
          <input
            id="donor-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلًا: محمد أحمد"
            maxLength={80}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "donor-name-error" : undefined}
          />
          {errors.name && (
            <span id="donor-name-error" className="input-error-msg">
              {errors.name}
            </span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="donor-phone">رقم موبايلك</label>
          <PhoneInput
            id="donor-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={!!errors.phone}
            aria-describedby={
              errors.phone ? "donor-phone-error" : "donor-phone-hint"
            }
          />
          {errors.phone ? (
            <span id="donor-phone-error" className="input-error-msg">
              {errors.phone}
            </span>
          ) : (
            <span id="donor-phone-hint" className="text-xs text-text-muted">
              هنكلمك عليه عشان نرتب التبرع
            </span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="donation-cause">عايز تتبرع لـ</label>
        <select
          id="donation-cause"
          value={cause}
          onChange={(e) => onCauseChange(e.target.value)}
          aria-invalid={!!errors.cause}
          aria-describedby={errors.cause ? "donation-cause-error" : undefined}
        >
          <option value="">اختار باب الخير</option>
          {DONATION_CAUSES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {errors.cause && (
          <span id="donation-cause-error" className="input-error-msg">
            {errors.cause}
          </span>
        )}
      </div>

      <fieldset
        className="form-group border-0 p-0 m-0 min-w-0"
        aria-describedby={errors.type ? "donation-type-error" : undefined}
      >
        <legend className="text-sm font-bold text-green-dark mb-1.5">
          هتتبرع بإيه؟
        </legend>
        <div className="flex flex-wrap gap-2">
          {types.map((id) => {
            const t = DONATION_TYPES.find((x) => x.id === id)!;
            const active = currentType === id;
            return (
              <label
                key={id}
                className={`inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl border-2 cursor-pointer text-sm font-bold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-green ${
                  active
                    ? "bg-green border-green text-white"
                    : "bg-cream border-[rgba(26,122,74,0.2)] text-text"
                }`}
              >
                <input
                  type="radio"
                  name="donation-type"
                  value={id}
                  checked={active}
                  onChange={() => setType(id)}
                  className="sr-only"
                />
                <span aria-hidden="true">{t.icon}</span>
                {t.label}
              </label>
            );
          })}
        </div>
        {errors.type && (
          <span id="donation-type-error" className="input-error-msg">
            {errors.type}
          </span>
        )}
      </fieldset>

      <div className="form-group">
        <label htmlFor="donation-notes">ملاحظات (اختياري)</label>
        <textarea
          id="donation-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          placeholder={
            currentType === "money"
              ? "مثلًا: المبلغ اللي في بالك، أو لو عايزها شهرية"
              : "مثلًا: الحاجات اللي عندك، وعنوانك وميعاد مناسب نعدّي نستلم"
          }
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <span className="input-error-msg">{errors.notes}</span>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] rounded-xl p-3 text-sm font-bold"
        >
          {submitError}
          {selected && (
            <a
              href={donationWhatsappLink(selected, {
                name: name.trim(),
                type: currentType || undefined,
                notes: notes.trim(),
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#25D366] text-white font-extrabold"
            >
              <WhatsAppIcon className="w-5 h-5" />
              ابعت طلبك على واتساب
            </a>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-green text-white font-extrabold text-base cursor-pointer font-['Cairo',sans-serif] transition-transform duration-200 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-wait"
      >
        {sending ? "جاري الإرسال..." : "ابعت طلب التبرع 🤲"}
      </button>
    </form>
  );
}
