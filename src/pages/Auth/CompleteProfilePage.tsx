// ─── /complete-profile: the same form as the "before your first order" sheet, on its own page
// Nothing sends people here after signing in any more (they go straight in, like
// Talabat); the page stays for old links and for anyone who opens it.
import { Navigate, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { needsProfileCompletion } from '@/repositories';
import { ROUTES } from '@/routes';
import { useRedirectTarget } from '@/hooks/useRedirectTarget';
import { AuthLayout } from './AuthLayout';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';

export default function CompleteProfilePage() {
  const user = useAuthStore((s) => s.session?.user);
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();
  const target = useRedirectTarget();

  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (!needsProfileCompletion(user)) return <Navigate to={target} replace />;

  return (
    <AuthLayout
      title="كمّل بياناتك"
      subtitle="المندوب محتاج رقمك وقريتك ومكان بيتك على الخريطة"
      footer={
        <button
          type="button"
          className="text-text-muted underline min-h-11 px-3 cursor-pointer"
          onClick={() => navigate(ROUTES.home, { replace: true })}
        >
          مش دلوقتي، هكمّل لما أطلب
        </button>
      }
    >
      <CompleteProfileForm
        user={user}
        onDone={(saved) => {
          showToast(`🎉 أهلاً بيك في قريتي يا ${saved.name.split(' ')[0]}!`);
          navigate(target, { replace: true });
        }}
      />
    </AuthLayout>
  );
}
