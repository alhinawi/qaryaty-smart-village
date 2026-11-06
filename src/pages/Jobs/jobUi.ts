// ─── Button styles and a sign-in helper the وظائف pages share
import { useNavigate } from 'react-router';
import { ROUTES } from '@/routes';

/** Sends a guest to /login and back here after */
export function useSignInFirst() {
  const navigate = useNavigate();
  return (from: string) => navigate(ROUTES.login, { state: { from } });
}

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-green text-white font-extrabold text-[0.9375rem] border-0 cursor-pointer no-underline font-[\'Cairo\',sans-serif] disabled:opacity-60';
export const outlineBtn =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-green-dark border-2 border-green font-extrabold text-sm cursor-pointer no-underline font-[\'Cairo\',sans-serif] disabled:opacity-60';
export const dangerBtn =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-[#b42318] border-2 border-[#f3c4c0] font-extrabold text-sm cursor-pointer font-[\'Cairo\',sans-serif] disabled:opacity-60';
