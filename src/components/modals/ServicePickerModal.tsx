import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { OrderModalData, Service } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { imageForService } from '@/config/serviceImages';
import { CATEGORIES } from '@/data/categories';
import { matchesSearch } from '@/utils/arabicSearch';
import { providersForService } from '@/utils/peopleSections';
import { providerToOrderModalData, serviceToOrderModalData } from '@/utils/pricing';
import { ProviderPickerModal } from '@/pages/Home/ProviderPickerModal';

interface ServicePickerModalProps {
  onClose: () => void;
  onOpenOrder: (data: OrderModalData) => void;
}
function ServicePhoto({ service }: { service: Service }) {
  const [failed, setFailed] = useState(false);
  const src = imageForService(service);
  return src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} className="w-full h-full object-cover" /> : <ImagePlaceholder />;
}
export function ServicePickerModal({ onClose, onOpenOrder }: ServicePickerModalProps) {
  const services = useCatalogStore(state => state.services);
  const providers = useCatalogStore(state => state.providers);
  const loadState = useCatalogStore(state => state.loadState);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Service | null>(null);
  const filtered = useMemo(() => services.filter(service => (category === 'all' || service.cat === category) && matchesSearch(query, [service.name, service.desc, ...(service.keywords ?? [])])), [services, category, query]);
  const people = useMemo(() => selected ? providersForService(selected, providers) : [], [selected, providers]);
  const openOrder = (data: OrderModalData) => { onClose(); onOpenOrder(data); };
  const choose = (service: Service) => { if (providersForService(service, providers).length) setSelected(service); else openOrder(serviceToOrderModalData(service)); };
  if (selected) return <ProviderPickerModal service={selected} providers={people} onClose={() => setSelected(null)} onAnyone={service => openOrder(serviceToOrderModalData(service))} onPick={provider => openOrder(providerToOrderModalData(provider, selected))} />;
  return (
    <Modal isOpen onClose={onClose} title="اختار الخدمة اللي محتاجها" maxWidth="680px">
      <p className="text-xs text-text-muted text-center -mt-1 mb-4">خدمات قريتك في مكان واحد. اختار خدمة وكمّل طلبك.</p>
      <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-stone-50 px-3 mb-3">
        <Search size={19} className="text-green shrink-0" />
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="دور على خدمة" placeholder="دور على عيش، سباك، مدرس..." className="w-full py-3 bg-transparent outline-none text-sm min-w-0" />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-1" aria-label="فئات الخدمات">
        {CATEGORIES.filter(item => item.id !== 'restaurants').map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className={`shrink-0 text-[11px] font-bold rounded-full px-3 py-2 border ${category === item.id ? 'bg-green text-white border-green' : 'bg-white text-text-muted border-gray-200'}`}>{item.label}</button>)}
      </div>
      <div className="flex justify-between text-[11px] text-text-muted mb-3"><span>اختار خدمة</span><span>{filtered.length} خدمة</span></div>
      {loadState !== 'ready' && services.length === 0 ? <p className="text-center text-sm py-8">بنحمّل الخدمات...</p> : filtered.length ? <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-4 pb-3">
        {filtered.map(service => <button type="button" key={service.id} onClick={() => choose(service)} aria-label={`اختار خدمة ${service.name}`} className="text-center min-w-0 group">
          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-stone-50 border border-green/10 mb-2 group-hover:border-green"><ServicePhoto service={service} /></div>
          <span className="block text-[11px] font-bold text-green-dark leading-5">{service.name}</span>
        </button>)}
      </div> : <p className="text-center text-sm text-text-muted py-8">مفيش خدمة بالاسم ده. جرّب كلمة تانية.</p>}
    </Modal>
  );
}
