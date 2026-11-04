// ─── Mobile menu (☰) links
// The burger menu in the phone/tablet header (below lg, 1024px). It holds the
// secondary pages so the header keeps only notifications, cart and the menu.
// Desktop has these in its nav bar and footer instead.

import { ROUTES } from '@/routes';

export interface MobileMenuLink {
  id: 'messages' | 'about' | 'groups' | 'advertise' | 'admin';
  label: string;
  /** Emoji shown in the item's icon tile */
  icon: string;
  /** In-app path, may end with a #section */
  to: string;
  /** Optional second line under the label */
  hint?: string;
}

export interface MobileMenuSection {
  id: 'app' | 'qaryaty' | 'staff';
  /** Section heading; empty for the first section */
  title: string;
  links: MobileMenuLink[];
}

interface MobileMenuOptions {
  isAdmin: boolean;
}

/** The menu's sections, in order. The admin panel only shows for admins. */
export function mobileMenuSections({ isAdmin }: MobileMenuOptions): MobileMenuSection[] {
  const sections: MobileMenuSection[] = [
    {
      id: 'app',
      title: '',
      links: [{ id: 'messages', label: 'الرسائل', icon: '💬', to: ROUTES.messages }],
    },
    {
      id: 'qaryaty',
      title: 'قريتي',
      links: [
        { id: 'about', label: 'عن قريتي', icon: 'ℹ️', to: ROUTES.about },
        { id: 'groups', label: 'جروبات واتساب', icon: '👥', to: ROUTES.groups },
        {
          id: 'advertise',
          label: 'أعلن عن محلك',
          icon: '📢',
          to: `${ROUTES.about}#advertise`,
          hint: 'عندك محل وعايز تظهر في قريتي؟',
        },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      id: 'staff',
      title: 'الإدارة',
      links: [{ id: 'admin', label: 'لوحة التحكم', icon: '⚙️', to: ROUTES.admin }],
    });
  }

  return sections;
}
