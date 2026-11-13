// ─── Developer contact links
// Shown next to "تطوير وتصميم" in the desktop footer and on the About page.
// Change a link here and both places update.

/** The app's developer, as credited in the footer and the About page (also a teacher in the app) */
export const DEVELOPER_NAME = 'Mohamed Alhinawi';

export type DeveloperLinkId = 'linkedin' | 'github' | 'facebook' | 'whatsapp';

export interface DeveloperLink {
  id: DeveloperLinkId;
  /** Name read by screen readers and shown as the tooltip */
  label: string;
  url: string;
}

/** His IELTS certificate (Google Drive, anyone with the link), shown on his English teacher card */
export const DEVELOPER_IELTS_CERTIFICATE_URL =
  'https://drive.google.com/file/d/10JKnLOyvdNTyD73aErrxVthWoy1kohNT/view?usp=drivesdk';

/** A folder of sample English and programming lessons (Google Drive), shown on both his teacher cards */
export const DEVELOPER_LESSON_SAMPLES_URL = 'https://drive.google.com/drive/folders/1-0y6uXa07T7bbKinrWscVrh7vZl-A8Ol';

/** WhatsApp number in international format, digits only (Egypt: 20 + the number without its leading 0) */
export const DEVELOPER_WHATSAPP = '201028928248';

/** WhatsApp chat with us, optionally with a message already typed in */
export function whatsappChatLink(text?: string): string {
  const base = `https://wa.me/${DEVELOPER_WHATSAPP}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Phone call link to the same number (local Egyptian number with +20) */
export const DEVELOPER_PHONE_LINK = `tel:+${DEVELOPER_WHATSAPP}`;

/** Message typed in for a shop owner who wants to list or advertise their shop */
export const ADVERTISE_MESSAGE =
  'السلام عليكم، عندي محل وعايز أعلن عنه في قريتي.\nاسم المحل: \nنوعه: \nالقرية: ';

export const DEVELOPER_LINKS: readonly DeveloperLink[] = [
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/hinawi' },
  { id: 'github', label: 'GitHub', url: 'https://github.com/alhinawi' },
  { id: 'facebook', label: 'Facebook', url: 'https://facebook.com/hinawi' },
  { id: 'whatsapp', label: 'واتساب', url: whatsappChatLink() },
];
