// ─── Where to go after login/register
import { useLocation } from 'react-router';
import { ROUTES } from '@/routes';

/** The page that sent the user to /login (location.state.from), else `fallback`. */
export function useRedirectTarget(fallback: string = ROUTES.profile): string {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from.startsWith('/') && !from.startsWith('//') ? from : fallback;
}
