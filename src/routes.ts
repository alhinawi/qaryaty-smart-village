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
  about: '/about',
  groups: '/groups',
  donate: '/donate',
  /** وظائف: the list; /jobs/new posts one, /jobs/mine is the poster's own, /jobs/:id one job */
  jobs: '/jobs',
  jobsNew: '/jobs/new',
  jobsMine: '/jobs/mine',
  /** Admin: posts waiting for review */
  jobsReview: '/jobs/review',
} as const;

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
