// ─── Mobile menu (☰) links
// The burger menu in the phone/tablet header (below lg, 1024px). It holds the
// secondary pages so the header keeps only notifications, cart and the menu.
// Desktop has these in its nav bar and footer instead.

import { ROUTES } from '@/routes';
import { isStaffRole, canReviewContent, canManageProviders } from '@/config/staffTiers';
import type { UserRole } from '@/types';

export interface MobileMenuLink {
  id: 'messages' | 'jobs' | 'jobsReview' | 'marketSale' | 'marketSwap' | 'marketReview' | 'rides' | 'ridesReview' | 'about' | 'groups' | 'donate' | 'advertise' | 'admin' | 'dashboard';
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
  role: UserRole | null | undefined;
}

/** The menu's sections, in order. Staff links follow the tier: review queues
// for reviewers, the provider dashboard for orders/shops supervisors, /admin for all staff. */
export function mobileMenuSections({ role }: MobileMenuOptions): MobileMenuSection[] {
  const sections: MobileMenuSection[] = [
    {
      id: 'app',
      title: '',
      links: [
        { id: 'messages', label: 'الرسائل', icon: '💬', to: ROUTES.messages },
        { id: 'jobs', label: 'وظائف', icon: '💼', to: ROUTES.jobs, hint: 'شغل في قريتك والقرى اللي جنبك' },
        { id: 'marketSale', label: 'بيع المستعمل', icon: '🏷️', to: ROUTES.marketSale, hint: 'بيع واشتري حاجات مستعملة' },
        { id: 'marketSwap', label: 'تبادل', icon: '🔄', to: ROUTES.marketSwap, hint: 'بدّل حاجة بحاجة من غير فلوس' },
        { id: 'rides', label: 'شير مواصلة', icon: '🚗', to: ROUTES.rides, hint: 'اقسم التاكسي أو شيّر كراسي عربيتك' },
      ],
    },
    {
      id: 'qaryaty',
      title: 'قريتي',
      links: [
        { id: 'about', label: 'عن قريتي', icon: 'ℹ️', to: ROUTES.about },
        { id: 'groups', label: 'جروبات واتساب', icon: '👥', to: ROUTES.groups },
        {
          id: 'donate',
          label: 'باب الخير',
          icon: '🤲',
          to: ROUTES.donate,
          hint: 'بيت المال، الجمعية الشرعية، تجهيز عرايس',
        },
        {
          id: 'advertise',
          label: 'أعلن عن محلك أو خدمتك',
          icon: '📢',
          to: `${ROUTES.about}#advertise`,
          hint: 'عندك محل أو خدمة وعايز تظهر في قريتي؟',
        },
      ],
    },
  ];

  const staffLinks: MobileMenuLink[] = [];
  if (canReviewContent(role)) {
    staffLinks.push(
      { id: 'jobsReview', label: 'مراجعة الوظائف', icon: '🗂️', to: ROUTES.jobsReview },
      { id: 'marketReview', label: 'بلاغات المستعمل والتبادل', icon: '🚩', to: ROUTES.marketReview },
      { id: 'ridesReview', label: 'بلاغات شير المواصلة', icon: '🚩', to: ROUTES.ridesReview },
    );
  }
  if (canManageProviders(role)) {
    staffLinks.push({ id: 'dashboard', label: 'لوحة مقدم الخدمة', icon: '📊', to: ROUTES.dashboard, hint: 'المحلات ومقدمي الخدمة والطلبات' });
  }
  if (isStaffRole(role)) {
    staffLinks.push({ id: 'admin', label: 'لوحة التحكم', icon: '⚙️', to: ROUTES.admin });
  }
  if (staffLinks.length) {
    sections.push({ id: 'staff', title: 'الإدارة', links: staffLinks });
  }

  return sections;
}
