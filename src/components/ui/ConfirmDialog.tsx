// ─── Imports
import { Modal } from '@/components/ui/Modal';
import { useConfirmStore } from '@/stores/useConfirmStore';

// ─── Component
/** The app's one yes/no dialog; mounted once in App. */
export function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request);
  const answer = useConfirmStore((s) => s.answer);

  return (
    <Modal isOpen={request !== null} onClose={() => answer(false)} title={request?.title} maxWidth="420px">
      {request && (
        <div dir="rtl" className="text-right">
          <p className="text-[15px] leading-7 text-gray-700 mb-5">{request.message}</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              className="flex-1 py-3 rounded-xl bg-green-dark text-white font-extrabold cursor-pointer"
              onClick={() => answer(true)}
            >
              {request.confirmLabel}
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-800 font-bold cursor-pointer"
              onClick={() => answer(false)}
            >
              {request.cancelLabel}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
