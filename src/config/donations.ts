// ─── باب الخير: donations and charity causes (/donate)
// To add an organization, change a description, or fill in real payment details, edit this
// file only. The page, the form and the WhatsApp messages all read from here.
//
// HOW TO FILL IN A REAL ORGANIZATION
// For each cause you can add, once you have them from the organization itself:
//   contact.name      the person or office in charge, e.g. 'لجنة الزكاة بمسجد …'
//   contact.whatsapp  their WhatsApp in international format, digits only: 2010xxxxxxxx
//                     (the WhatsApp button then goes to them instead of to us)
//   contact.phone     a number to call, local format 01xxxxxxxxx
//   address           where they are, e.g. 'جنب المسجد الكبير'
//   payment.instapay  their InstaPay address, e.g. 'name@instapay'
//   payment.wallets   mobile wallets: [{ name: 'فودافون كاش', number: '010xxxxxxxx' }]
//   payment.bank      { bankName, accountName, accountNumber, iban? } (iban: EG + 27 digits)
// Anything left out simply doesn't show. Never put a number here that the organization
// didn't give you in person: people will send real money to it.
//
// PLACEHOLDERS: no cause has real contact or payment details yet. Until then every cause
// goes through our own WhatsApp and the "عايز أتبرع" form, and we arrange the donation.

import { whatsappChatLink } from "./developer";

export type DonationType = "money" | "clothes" | "furniture" | "food" | "other";

export const DONATION_TYPES: readonly {
  id: DonationType;
  label: string;
  icon: string;
}[] = [
  { id: "money", label: "فلوس", icon: "💵" },
  { id: "clothes", label: "هدوم", icon: "👕" },
  { id: "furniture", label: "عفش وأجهزة", icon: "🛋️" },
  { id: "food", label: "أكل وتموين", icon: "🍚" },
  { id: "other", label: "حاجة تانية", icon: "🎁" },
];

export interface DonationWallet {
  /** e.g. 'فودافون كاش', 'اتصالات كاش', 'أورانج كاش', 'وي باي' */
  name: string;
  /** Local mobile number 01xxxxxxxxx */
  number: string;
}

export interface DonationBank {
  bankName: string;
  accountName: string;
  accountNumber: string;
  /** Egyptian IBAN: EG followed by 27 digits */
  iban?: string;
}

export interface DonationPayment {
  instapay?: string;
  wallets?: DonationWallet[];
  bank?: DonationBank;
}

export interface DonationCause {
  /** Stable key, lowercase letters and dashes; saved with every request, so don't rename it */
  id: string;
  icon: string;
  name: string;
  /** organization: a body in the village (بيت المال، الجمعية). cause: a kind of good deed. */
  kind: "organization" | "cause";
  /** One or two warm lines: what the money or things go to */
  description: string;
  /** What people can give to this cause; the form offers these (and "حاجة تانية") */
  accepts: DonationType[];
  contact?: { name?: string; whatsapp?: string; phone?: string };
  address?: string;
  payment?: DonationPayment;
}

export const DONATION_CAUSES: readonly DonationCause[] = [
  // ── Organizations in the village
  {
    id: "beit-almal",
    icon: "🕌",
    name: "بيت المال",
    kind: "organization",
    description:
      "زكاة مالك وصدقاتك بتتجمع وتتوزع على الأسر المحتاجة في القرية، بالأولوية للأقرب فالأقرب.",
    accepts: ["money", "food"],
  },
  {
    id: "gameya-sharia",
    icon: "🤝",
    name: "الجمعية الشرعية",
    kind: "organization",
    description:
      "كفالة أيتام، ومساعدة أسر محتاجة، وعلاج مرضى. تبرعك بيوصل عن طريق فرع الجمعية في القرية.",
    accepts: ["money", "clothes", "food", "furniture"],
  },
  // ── Kinds of good deeds
  {
    id: "brides",
    icon: "👰",
    name: "تجهيز عرايس",
    kind: "cause",
    description:
      "ساعد بنت من بنات القرية تكمّل جهازها: أجهزة كهربائية، مفروشات، أو مبلغ يسد اللي ناقص.",
    accepts: ["money", "furniture"],
  },
  {
    id: "orphans",
    icon: "🧒",
    name: "كفالة يتيم",
    kind: "cause",
    description:
      "مبلغ شهري أو مرة واحدة لطفل يتيم من القرية، يساعده في أكله ولبسه ومصاريف مدرسته.",
    accepts: ["money", "clothes"],
  },
  {
    id: "ramadan-bag",
    icon: "🌙",
    name: "شنطة رمضان وكرتونة الخير",
    kind: "cause",
    description:
      "رز وسكر وزيت ومكرونة وبقوليات للأسر المحتاجة، في رمضان وفي أي وقت من السنة.",
    accepts: ["money", "food"],
  },
  {
    id: "feeding",
    icon: "🍲",
    name: "إطعام وإفطار صايم",
    kind: "cause",
    description:
      "وجبات سخنة لكبار السن والأسر اللي محتاجة، وإفطار صايم في رمضان.",
    accepts: ["money", "food"],
  },
  {
    id: "medical",
    icon: "💊",
    name: "علاج المرضى",
    kind: "cause",
    description:
      "مصاريف كشف وتحاليل وأدوية وعمليات لمرضى من القرية مش قادرين على تكلفة العلاج.",
    accepts: ["money"],
  },
  {
    id: "debtors",
    icon: "⚖️",
    name: "الغارمين والغارمات",
    kind: "cause",
    description:
      "سداد دين عن حد اتزنق في قسط أو وصل أمانة، علشان يرجع لبيته وولاده.",
    accepts: ["money"],
  },
  {
    id: "winter-clothes",
    icon: "🧥",
    name: "كسوة الشتا",
    kind: "cause",
    description:
      "بطاطين وهدوم شتوي للكبار والصغار. الهدوم المستعملة لازم تكون نضيفة وسليمة.",
    accepts: ["clothes", "money"],
  },
  {
    id: "sadaqa-jariya",
    icon: "💧",
    name: "صدقة جارية",
    kind: "cause",
    description:
      "كولدير مية، فرش وتجديد مسجد، مصاحف، أو أي حاجة الناس تفضل تنتفع بيها وثوابها مستمر.",
    accepts: ["money", "furniture"],
  },
];

/** Words that bring up باب الخير in the home search, besides the causes' names */
export const DONATION_KEYWORDS = [
  "باب الخير",
  "تبرع",
  "تبرعات",
  "اتبرع",
  "زكاة",
  "صدقة",
  "جمعية",
  "عروسة",
  "عرايس",
  "أيتام",
  "محتاجين",
  "كرتونة رمضان",
];

/** Text the home search looks in for باب الخير */
export const DONATION_SEARCH_FIELDS: readonly string[] = [
  ...DONATION_KEYWORDS,
  ...DONATION_CAUSES.map((c) => c.name),
];

/** Label for a donation type */
export function donationTypeLabel(type: DonationType): string {
  return DONATION_TYPES.find((t) => t.id === type)?.label ?? type;
}

/** The types the form offers for a cause: what it accepts, then "حاجة تانية" */
export function donationTypesFor(
  cause: DonationCause | undefined,
): DonationType[] {
  const accepted =
    cause?.accepts ??
    DONATION_TYPES.map((t) => t.id).filter((t) => t !== "other");
  return [...accepted.filter((t) => t !== "other"), "other"];
}

export function findCause(id: string): DonationCause | undefined {
  return DONATION_CAUSES.find((c) => c.id === id);
}

/** True when the cause has at least one way to pay it directly */
export function hasPaymentDetails(cause: DonationCause): boolean {
  const p = cause.payment;
  return !!p && (!!p.instapay || (p.wallets?.length ?? 0) > 0 || !!p.bank);
}

/** Message typed in for a donor asking about a cause */
export function donationMessage(
  cause: DonationCause,
  details?: { name?: string; type?: DonationType; notes?: string },
): string {
  const lines = [`السلام عليكم، عايز أتبرع لـ"${cause.name}" من خلال قريتي.`];
  if (details?.name) lines.push(`الاسم: ${details.name}`);
  lines.push(
    `نوع التبرع: ${details?.type ? donationTypeLabel(details.type) : ""}`,
  );
  if (details?.notes) lines.push(`ملاحظات: ${details.notes}`);
  return lines.join("\n");
}

/** WhatsApp chat for a cause: the organization's own number once it's filled in, else ours */
export function donationWhatsappLink(
  cause: DonationCause,
  details?: { name?: string; type?: DonationType; notes?: string },
): string {
  const text = donationMessage(cause, details);
  const own = cause.contact?.whatsapp;
  return own
    ? `https://wa.me/${own}?text=${encodeURIComponent(text)}`
    : whatsappChatLink(text);
}
