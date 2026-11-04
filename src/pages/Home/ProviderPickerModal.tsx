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
        <div className="flex flex-col gap-3.5">
          <p className="text-sm text-text-muted text-center m-0">
            {providers.length} متاحين، الأعلى تقييمًا الأول
          </p>
          <button
            type="button"
            onClick={() => onAnyone(service)}
            className="w-full bg-[#e8f5ee] text-green-dark border-2 border-green rounded-2xl py-3 px-4 text-sm font-bold cursor-pointer hover:bg-green hover:text-white transition-colors"
          >
            مش فارق معاك مين؟ اطلب ونبعتلك أقرب حد متاح
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} onBook={onPick} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
