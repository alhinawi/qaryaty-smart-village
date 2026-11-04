// ─── Tab navigation on top of react-router
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { ActiveTab } from '@/types';
import { TAB_PATHS, pathToTab } from '@/routes';

/** The tab that matches the current URL (null on /login, /admin, …). */
export function useActiveTab(): ActiveTab | null {
  const { pathname } = useLocation();
  return pathToTab(pathname);
}

/** Navigate to a tab's URL. Same shape as the old `setActiveTab`. */
export function useGoToTab(): (tab: ActiveTab) => void {
  const navigate = useNavigate();
  return useCallback(
    (tab: ActiveTab) => {
      navigate(TAB_PATHS[tab]);
      window.scrollTo({ top: 0 });
    },
    [navigate]
  );
}
