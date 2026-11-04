// ─── Pick who comes for an ordinary service (سباك، نجار، جزار…), or let the village choose
import type { Provider, Service } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { ProviderCard } from '@/components/shared/ProviderCard';

interface ProviderPickerModalProps {
  service: Service | null;
  providers: Provider[];
  onPick: (provider: Provider) => void;
  onAnyone: (service: Service) => void;
  onClose: () => void;
}

export function ProviderPickerModal({
  service,
  providers,
  onPick,
  onAnyone,
  onClose,
}: ProviderPickerModalProps) {
  return (
    <Modal
      isOpen={service != null}
      onClose={onClose}
      emoji={service?.emoji}
      title={service ? `اختار مين يجيلك: ${service.name}` : ''}
      maxWidth="640px"
    >
      {service && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] sm:text-sm text-text-muted text-center m-0">
            {providers.length} متاحين، الأعلى تقييمًا الأول
          </p>
          <button
            type="button"
            onClick={() => onAnyone(service)}
            className="group w-full min-h-12 flex flex-col items-center justify-center gap-0.5 bg-[#e8f5ee] text-green-dark border-2 border-green rounded-2xl py-2.5 px-4 cursor-pointer hover:bg-green hover:text-white transition-colors"
          >
            <span className="text-sm font-extrabold leading-snug">مش فارق معاك مين؟</span>
            <span className="text-xs font-bold leading-snug text-green-dark/80 group-hover:text-white/90">
              اطلب ونبعتلك أقرب حد متاح
            </span>
          </button>
          {/* On the white sheet the cards get a thin border instead of a shadow,
              a little less padding on narrow phones, and a full-size book button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 [&>article]:border-gray-200 [&>article]:shadow-none [&>article]:p-3.5 sm:[&>article]:p-4 [&_button]:min-h-11 [&_button]:px-5 [&_button]:text-sm">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} onBook={onPick} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
