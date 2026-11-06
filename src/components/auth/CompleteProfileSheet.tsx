// ─── The "before your first order" sheet, opened by ensureProfileForOrder()
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useProfilePromptStore } from '@/stores/useProfilePromptStore';
import CompleteProfileForm from './CompleteProfileForm';

export function CompleteProfileSheet() {
  const open = useProfilePromptStore((s) => s.open);
  const close = useProfilePromptStore((s) => s.close);
  const done = useProfilePromptStore((s) => s.done);
  const user = useAuthStore((s) => s.session?.user);
  const showToast = useUIStore((s) => s.showToast);

  if (!user) return null;

  return (
    <Modal isOpen={open} onClose={close} title="قبل أول طلب" emoji="📍" maxWidth="480px">
      <p className="text-sm text-text-muted mb-3">المندوب محتاج رقمك وقريتك ومكان بيتك على الخريطة. مرة واحدة بس.</p>
      {open && (
        <CompleteProfileForm
          user={user}
          submitLabel="حفظ وكمّل الطلب"
          onDone={(saved) => {
            showToast(`✅ تمام يا ${saved.name.split(' ')[0]}، كمّل طلبك`);
            done();
          }}
        />
      )}
    </Modal>
  );
}
