// ─── App routes
// One real URL per page, so the browser/Android back button and shared links work.
import type { ActiveTab } from '@/types';

export const TAB_PATHS: Record<ActiveTab, string> = {
  home: '/',
  orders: '/orders',
  favorites: '/favorites',
  messages: '/messages',
  profile: '/profile',
};

export const ROUTES = {
  ...TAB_PATHS,
  login: '/login',
  register: '/register',
  /** Google sends the customer back here signed in. */
  authCallback: '/auth/callback',
  /** Google accounts pick a username and give a phone here before ordering. */
  completeProfile: '/complete-profile',
  admin: '/admin',
  /** Provider dashboard: merchants and professionals (provider/staff tiers) */
  dashboard: '/dashboard',
  about: '/about',
  groups: '/groups',
  donate: '/donate',
  /** وظائف: the list; /jobs/new posts one, /jobs/mine is the poster's own, /jobs/:id one job */
  jobs: '/jobs',
  jobsNew: '/jobs/new',
  jobsMine: '/jobs/mine',
  /** Admin: posts waiting for review */
  jobsReview: '/jobs/review',
  /** بيع المستعمل */
  marketSale: '/market/sale',
  /** تبادل */
  marketSwap: '/market/swap',
  /** New post: ?kind=sale or ?kind=swap */
  marketNew: '/market/new',
  /** إعلاناتي */
  marketMine: '/market/mine',
  /** Admin: hidden (reported) posts */
  marketReview: '/market/review',
  /** شير مواصلة: the list; /rides/new posts one, /rides/mine is the poster's own and their requests */
  rides: '/rides',
  ridesNew: '/rides/new',
  ridesMine: '/rides/mine',
  /** Admin: trips hidden by reports */
  ridesReview: '/rides/review',
} as const;

export const marketListPath = (kind: 'sale' | 'swap') => (kind === 'sale' ? ROUTES.marketSale : ROUTES.marketSwap);
export const marketItemPath = (id: string) => `/market/item/${id}`;
export const marketEditPath = (id: string) => `/market/item/${id}/edit`;
export const marketChatPath = (listingId: string, buyerId: string) => `/market/chat/${listingId}/${buyerId}`;

/** One shared trip's page */
export const ridePath = (id: string) => `${ROUTES.rides}/${encodeURIComponent(id)}`;
/** Edit one of your own trips */
export const rideEditPath = (id: string) => `${ridePath(id)}/edit`;

/** One job's page */
export function jobPath(id: string): string {
  return `${ROUTES.jobs}/${encodeURIComponent(id)}`;
}

/** Edit one of your own jobs */
export function jobEditPath(id: string): string {
  return `${jobPath(id)}/edit`;
}

/** The bottom/top nav tab for a URL, or null for pages outside the tabs (login, admin…). */
export function pathToTab(pathname: string): ActiveTab | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const entry = (Object.entries(TAB_PATHS) as [ActiveTab, string][]).find(
    ([, path]) => path === clean
  );
  return entry ? entry[0] : null;
}
