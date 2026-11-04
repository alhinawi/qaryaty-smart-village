// ─── WhatsApp groups we start the service with, until the platform launches
// Shown on the /groups page. To add or change a group, edit this file only.
//
// HOW TO FILL IN A LINK
// In WhatsApp: open the group → group info → "Invite via link" → copy the link.
// It looks like https://chat.whatsapp.com/AbCdEf123456 . Paste it in `url`.
// A group whose `url` is still '' shows on the page as "الرابط قريبًا" with no button.
//
// PLACEHOLDERS: every link below is still empty, waiting for the real invite links.

export interface WhatsAppGroup {
  /** Stable key, letters and dashes only */
  id: string;
  /** Emoji shown on the card */
  icon: string;
  /** Group name as it appears on the page */
  name: string;
  /** One line: what the group is for */
  description: string;
  /** Invite link https://chat.whatsapp.com/… — '' until the group is ready */
  url: string;
}

/** The "قريتي" community that holds all the groups. '' until it is ready. */
export const WHATSAPP_COMMUNITY = {
  name: 'مجتمع قريتي',
  // PLACEHOLDER: paste the community invite link here (community info → "Invite members" → copy link)
  url: '',
} as const;

export const WHATSAPP_GROUPS: readonly WhatsAppGroup[] = [
  {
    id: 'announcements',
    icon: '📢',
    name: 'إعلانات قريتي',
    description: 'أخبار قريتي، والعروض، وموعد إطلاق المنصة. للقراءة بس.',
    url: '', // PLACEHOLDER
  },
  {
    id: 'buy-sell',
    icon: '🛍️',
    name: 'بيع وشراء',
    description: 'اعرض أي حاجة عايز تبيعها، أو دوّر على حاجة عايز تشتريها من أهل القرية.',
    url: '', // PLACEHOLDER
  },
  {
    id: 'jobs',
    icon: '💼',
    name: 'شغل ووظايف',
    description: 'فرص شغل في القرية واللي حواليها، ولو بتدوّر على شغل اعرض نفسك.',
    url: '', // PLACEHOLDER
  },
  {
    id: 'exchange',
    icon: '🔄',
    name: 'تبادل',
    description: 'بدّل حاجة عندك مش محتاجها بحاجة محتاجها.',
    url: '', // PLACEHOLDER
  },
  {
    id: 'restaurants',
    icon: '🍽️',
    name: 'مطاعم وأكل',
    description: 'منيوهات مطاعم القرية وعروضها، واطلب أكلك.',
    url: '', // PLACEHOLDER
  },
  {
    id: 'shops',
    icon: '🛒',
    name: 'محلات وعروض',
    description: 'عروض السوبر ماركت والفرن والجزارة وباقي محلات القرية.',
    url: '', // PLACEHOLDER
  },
  {
    id: 'services',
    icon: '🔨',
    name: 'صنايعية وخدمات البيت',
    description: 'سباك، كهربائي، نجار، نقاش، وعمال التشطيب. اطلب أسطى.',
    url: '', // PLACEHOLDER
  },
  {
    id: 'teachers',
    icon: '👩‍🏫',
    name: 'مدرسين ودروس',
    description: 'مواعيد المجموعات والدروس الخصوصية لكل المراحل.',
    url: '', // PLACEHOLDER
  },
];

/** True for a real WhatsApp group or community invite link (https://chat.whatsapp.com/<code>). */
export function isWhatsAppInviteLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'chat.whatsapp.com' &&
      /^\/[A-Za-z0-9]{10,}\/?$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}
