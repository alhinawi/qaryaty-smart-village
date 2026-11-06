// ─── /auth/callback: Google sends the customer back here
// The Supabase client reads the tokens from the address bar (and removes them);
// a first-time Google account goes on to /complete-profile.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { AuthError, needsProfileCompletion } from '@/repositories';
import { ROUTES } from '@/routes';
import { AuthLayout } from './AuthLayout';
import { oauthErrorFrom } from './oauthError';

/** Only pages of this site, never another host. */
function safeReturn(path: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? path : ROUTES.profile;
}

export default function AuthCallbackPage() {
  const finishGoogleSignIn = useAuthStore((s) => s.finishGoogleSignIn);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();
  // Read once, before the Supabase client clears the address bar
  const [error, setError] = useState(() => oauthErrorFrom(window.location.search, window.location.hash));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    if (error) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
      return;
    }
    void (async () => {
      try {
        const result = await finishGoogleSignIn();
        if (!result) {
          setError('ماقدرناش ندخّلك بجوجل. جرّب تاني أو سجّل بالإيميل');
          return;
        }
        const returnTo = safeReturn(result.returnTo);
        if (needsProfileCompletion(result.user)) {
          navigate(ROUTES.completeProfile, { replace: true, state: { from: returnTo } });
          return;
        }
        showToast(`👋 أهلاً يا ${result.user.name.split(' ')[0]}!`);
        navigate(returnTo, { replace: true });
      } catch (err) {
        setError(err instanceof AuthError ? err.message : 'حصلت مشكلة، حاول تاني');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per visit
  }, []);

  return (
    <AuthLayout
      title={error ? 'التسجيل عبر جوجل ماكملش' : 'بندخّلك…'}
      subtitle={error ? 'مفيش حاجة اتغيرت في حسابك' : 'ثانية واحدة'}
      footer={
        <Link to={ROUTES.login} className="text-green font-bold">
          رجوع لتسجيل الدخول
        </Link>
      }
    >
      {error ? (
        <p className="input-error-msg text-center" role="alert">
          {error}
        </p>
      ) : (
        <div className="flex justify-center py-6" role="status" aria-label="بندخّلك">
          <div className="w-10 h-10 border-4 border-[rgba(26,122,74,0.15)] border-t-green rounded-full animate-[spin_0.8s_linear_infinite]" />
        </div>
      )}
    </AuthLayout>
  );
}
