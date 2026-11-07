import { CatalogReviews } from '@/components/reviews/CatalogReviews';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { ShopMenuPage } from '@/components/shop/ShopMenuPage';
import { ProviderCard } from '@/components/shared/ProviderCard';
import { CatalogShareButton } from '@/components/shared/CatalogShareButton';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { productsForShop } from '@/data/catalog';
import { providerToOrderModalData, serviceToOrderModalData } from '@/utils/pricing';
import { providersForService } from '@/utils/peopleSections';
import { groupPreselection } from '@/utils/teacherGroups';
import { validCatalogId, type CatalogKind } from '@/utils/catalogLinks';
import { isShopOpenNow } from '@/utils/shopOpenNow';
import type { OrderModalData, Provider, TeacherGroup } from '@/types';
export default function CatalogDetail({ kind, onOpenOrderModal }: { kind: CatalogKind; onOpenOrderModal: (data: OrderModalData) => void }) {
  const { id } = useParams();
  const { shops, providers, services, loadState, load } = useCatalogStore();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { void load(); }, [load]);
  const shop = kind === 'shop' ? shops.find(item => item.id === Number(id)) : undefined;
  const provider = kind === 'provider' ? providers.find(item => item.id === Number(id) && item.active && services.some(service => service.id === item.serviceId && !service.hidden)) : undefined;
  const service = kind === 'service' ? services.find(item => item.id === Number(id) && !item.hidden) : undefined;
  const name = shop?.name ?? provider?.name ?? service?.name;
  useEffect(() => { const old = document.title; if (name) document.title = `${name} | قريتي`; return () => { document.title = old; }; }, [name]);
  const book = (person: Provider, group?: TeacherGroup) => onOpenOrderModal(providerToOrderModalData(person, services.find(item => item.id === person.serviceId), group ? groupPreselection(group) : undefined));
  if (!validCatalogId(id) || (loadState === 'ready' && !name)) return <section className="p-5 text-center"><h1 className="text-xl font-extrabold mb-3">الصفحة دي مش متاحة دلوقتي</h1><p className="text-text-muted mb-4">ممكن الرابط قديم، أو المحل أو الخدمة مش ظاهرين حاليًا.</p><Link to="/" className="text-green font-bold">ارجع للرئيسية</Link></section>;
  if (!name) return <p role="status" className="p-5 text-text-muted">بنحمّل التفاصيل…</p>;
  const people = service ? providersForService(service, providers) : [];
  return <section className="max-w-2xl mx-auto p-4" dir="rtl">
    <Link to="/" className="inline-block text-sm text-green font-bold py-3">الرئيسية</Link>
    <header className="flex flex-wrap items-center justify-between gap-3 mb-4"><h1 className="text-2xl font-extrabold text-text">{name}</h1><CatalogShareButton kind={kind} id={Number(id)} name={name} /></header>
    {shop && <article className="bg-white rounded-2xl border border-green/15 p-4">
      {shop.photo && <ProductPhoto photo={shop.photo} emoji={shop.emoji} className="w-full h-44 rounded-xl overflow-hidden mb-4" />}
      <p className="text-text-muted mb-3">{shop.description}</p>
      {!shop.demo && <p className={`text-sm mb-3 ${isShopOpenNow(shop) ? 'text-green' : 'text-danger'}`}>{isShopOpenNow(shop) ? 'مفتوح حاليًا' : 'مغلق حاليًا'} {shop.time}</p>}
      <button type="button" className="w-full bg-green text-white rounded-xl p-3 font-bold disabled:opacity-50" disabled={!isShopOpenNow(shop) && !shop.demo} onClick={() => shop.kind === 'restaurant' || productsForShop(shop) ? setMenuOpen(true) : onOpenOrderModal({ name: `طلب من ${shop.name}`, desc: shop.description, emoji: shop.emoji, price: 'حسب الطلب' })}>{'شوف المنتجات'}</button>
      <ShopMenuPage shop={menuOpen ? shop : null} onClose={() => setMenuOpen(false)} />
    </article>}
    {provider && <ProviderCard headingLevel="h2" provider={provider} onBook={book} showShare={false} />}
    {service && <><p className="text-text-muted mb-4">{service.desc}</p>{people.length ? <div className="grid gap-3">{people.map(person => <ProviderCard headingLevel="h2" key={person.id} provider={person} onBook={book} />)}</div> : <button type="button" className="w-full bg-green text-white rounded-xl p-3 font-bold" onClick={() => onOpenOrderModal(serviceToOrderModalData(service))}>اطلب الخدمة</button>}</>}
    <CatalogReviews key={`${kind}:${id}`} kind={kind} target={Number(id)} />
  </section>;
}
