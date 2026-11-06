// ─── "التسجيل عبر جوجل" on /login and /register
// Shows itself only when the Google provider is on in Supabase (read from the
// public auth settings), so it appears by itself once Google is set up, no redeploy.
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthError, authRepo } from '@/repositories';

let enabledCheck: Promise<boolean> | null = null;

/** One settings request per page load. */
function googleEnabled(): Promise<boolean> {
  enabledCheck ??= authRepo.isGoogleEnabled().catch(() => false);
  return enabledCheck;
}

/** Google's own four-colour G. */
export function GoogleLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

interface GoogleAuthButtonProps {
  /** The page to open after coming back from Google. */
  returnTo: string;
}

export function GoogleAuthButton({ returnTo }: GoogleAuthButtonProps) {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [enabled, setEnabled] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    void googleEnabled().then((on) => alive && setEnabled(on));
    return () => {
      alive = false;
    };
  }, []);

  if (!enabled) return null;

  const handleClick = async () => {
    setError('');
    setLeaving(true);
    try {
      await signInWithGoogle(returnTo);
      // The browser is on its way to Google; keep the spinner until it leaves
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'ماقدرناش نفتح جوجل دلوقتي، جرّب تاني أو سجّل بالإيميل');
      setLeaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={leaving}
        aria-busy={leaving || undefined}
        className="relative w-full min-h-12 rounded-xl border-2 border-green/25 bg-white px-4 font-bold text-[15px] text-text flex items-center justify-center gap-3 cursor-pointer transition-colors hover:bg-green/5 hover:border-green/50 focus-visible:outline-2 focus-visible:outline-green disabled:opacity-60 disabled:cursor-wait"
      >
        <GoogleLogo className="w-5 h-5 shrink-0" />
        <span>{leaving ? 'بنفتح جوجل…' : 'التسجيل عبر جوجل'}</span>
      </button>
      {error && (
        <p className="input-error-msg text-center" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-black/10" />
        أو بالإيميل
        <span className="h-px flex-1 bg-black/10" />
      </div>
    </div>
  );
}
