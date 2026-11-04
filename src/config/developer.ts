// ─── Developer contact links
// Shown next to "تطوير وتصميم" in the desktop footer and on the About page.
// Change a link here and both places update.

export type DeveloperLinkId = 'linkedin' | 'github' | 'facebook' | 'whatsapp';

export interface DeveloperLink {
  id: DeveloperLinkId;
  /** Name read by screen readers and shown as the tooltip */
  label: string;
  url: string;
}

/** WhatsApp number in international format, digits only (Egypt: 20 + the number without its leading 0) */
export const DEVELOPER_WHATSAPP = '201028928248';

export const DEVELOPER_LINKS: readonly DeveloperLink[] = [
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/hinawi' },
  { id: 'github', label: 'GitHub', url: 'https://github.com/alhinawi' },
  { id: 'facebook', label: 'Facebook', url: 'https://facebook.com/hinawi' },
  { id: 'whatsapp', label: 'واتساب', url: `https://wa.me/${DEVELOPER_WHATSAPP}` },
];
