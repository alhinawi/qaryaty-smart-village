import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, Zap } from 'lucide-react';
import type { Service, Shop } from '@/types';
import { catalogPath } from '@/utils/catalogLinks';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { useProviderDashboardStore } from '@/stores/useProviderDashboardStore';
import { ShopMenuModal } from '@/components/modals/ShopMenuModal';
import { demoOpenNow, demoHoursLabel, demoRiderAvailable } from '@/utils/quickNeedsDemo';
import { quickNeedServices, quickNeedShops, type QuickNeed } from '@/utils/quickNeeds';

const NEEDS = [
  { id: 'pharmacy', label: 'صيدلية', emoji: '💊' },
  { id: 'grocery', label: 'سوبر ماركت', emoji: '🛒' },
  { id: 'delivery', label: 'توصيل', emoji: '🛵' },
] as const;

/** Fast navigation to catalog choices, deliberately not a live availability claim. */
export function QuickNeeds({ shops, services }: { shops: Shop[]; services: Service[] }) {
  const [open, setOpen] = useState(false);
  const demo = useTrackingDemoMode();
  const overrides = useProviderDashboardStore(state => state.merchants);
  const [now, setNow] = useState(() => new Date());
  const [menuShop, setMenuShop] = useState<Shop | null>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer); }, []);
  const [need, setNeed] = useState<QuickNeed>('pharmacy');
  const shownShops = quickNeedShops(demo ? shops.filter(shop => demoOpenNow(shop, now, overrides[shop.id]?.open)) : shops, need);
  const shownServices = quickNeedServices(services, need);
  const choices = [
    ...shownShops.map(shop => ({ id: `shop-${shop.id}`, name: shop.name, emoji: shop.emoji, subtitle: shop.village || 'شوف بيانات المحل', to: catalogPath('shop', shop.id), shop, status: demo ? `مفتوح دلوقتي · ${demoHoursLabel(shop)}` : '' })),
    ...shownServices.map(service => ({ id: `service-${service.id}`, name: service.name, emoji: service.emoji, subtitle: 'شوف تفاصيل الخدمة والتكلفة', to: catalogPath('service', service.id), shop: undefined, status: demo ? (demoRiderAvailable(now) ? 'مندوب متاح' : 'التوصيل يبدأ 7 الصبح') : '' })),
  ];
  return (
    <section className="mb-5 rounded-2xl border border-green/15 bg-white shadow-sm overflow-hidden" aria-label="محتاج دلوقتي">
      <button type="button" aria-expanded={open} aria-controls="quick-needs-panel" onClick={() => setOpen(value => !value)} className="min-h-[60px] w-full flex items-center gap-3 p-4 text-start">
        <span className="rounded-xl p-2 bg-green-light text-green-dark"><Zap size={22} aria-hidden="true" /></span>
        <span className="flex-1 min-w-0"><span className="block text-base font-extrabold text-green-dark">محتاج دلوقتي</span><span className="block text-xs text-text-muted mt-0.5">صيدلية، سوبر ماركت، أو توصيل في خطوات أقل</span></span>
        <ChevronDown size={20} aria-hidden="true" className={open ? 'rotate-180 shrink-0' : 'shrink-0'} />
      </button>
      <div id="quick-needs-panel" hidden={!open} className="px-3 pb-3">
        <div className="grid grid-cols-3 gap-2 mb-3" role="group" aria-label="اختار اللي محتاجه">
          {NEEDS.map(item => <button key={item.id} type="button" aria-pressed={need === item.id} onClick={() => setNeed(item.id)} className={`min-h-[48px] rounded-xl px-1 py-2 text-xs font-bold border ${need === item.id ? 'bg-green text-white border-green' : 'bg-white text-text border-gray-200'}`}><span aria-hidden="true">{item.emoji}</span> {item.label}</button>)}
        </div>
        {!demo && <p className="text-xs leading-relaxed text-text-muted mb-3">اختيارات من الكتالوج، مش تأكيد إن المحل فاتح أو إن التوصيل فوري. راجع التفاصيل قبل الطلب.</p>}
        <div className="grid sm:grid-cols-2 gap-2" aria-live="polite" aria-atomic="true">
          {choices.length === 0 ? <p className="p-3 rounded-xl bg-cream text-sm text-text-muted sm:col-span-2" role="status">مفيش اختيارات للقسم ده دلوقتي. جرّب قسم تاني.</p> : choices.map(choice => {
            const content = <><span aria-hidden="true" className="text-2xl shrink-0">{choice.emoji}</span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-text">{choice.name}</span><span className="block text-xs text-text-muted line-clamp-1">{choice.subtitle}</span>{choice.status && <span className="block text-xs font-bold text-green-dark mt-1">{choice.status}</span>}</span><span className="text-xs text-green-dark font-bold shrink-0">التفاصيل</span></>;
            const style = "min-h-[76px] rounded-xl border border-green/10 p-3 flex gap-3 items-center text-start hover:bg-green-light/40";
            return choice.shop && choice.shop.id < 0 ? <button key={choice.id} type="button" className={style} onClick={() => setMenuShop(choice.shop!)}>{content}</button> : <Link key={choice.id} to={choice.to} className={style}>{content}</Link>;
          })}
        </div>
      </div>
      <ShopMenuModal shop={menuShop && (!menuShop.demo || demo) && shops.some(shop => shop.id === menuShop.id) ? menuShop : null} onClose={() => setMenuShop(null)} />
    </section>
  );
}
