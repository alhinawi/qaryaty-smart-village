// ─── Imports
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Modal } from '@/components/ui/Modal';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { ShopMenuPage } from '@/components/shop/ShopMenuPage';
import { isShopOpenNow } from '@/utils/shopOpenNow';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { useUIStore } from '@/stores/useUIStore';
import { ROUTES } from '@/routes';
import { shopsForService } from '@/utils/serviceShops';
import type { Shop } from '@/types';

/**
 * A shop-like service was tapped (عيش، خضار، ألبان، جزارة): one open shop opens its menu
 * straight away; several are listed to pick from; none says so. Only products reach the cart.
 */
export function ServiceShopsModal() {
  const service = useUIStore((s) => s.shopService);
  const closeShopService = useUIStore((s) => s.closeShopService);
  const showToast = useUIStore((s) => s.showToast);
  const allShops = useCatalogStore((s) => s.shops);
  const loadState = useCatalogStore((s) => s.loadState);
  const load = useCatalogStore((s) => s.load);
  const [menuShop, setMenuShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (service) void load();
  }, [service, load]);

  const shops = useMemo(() => (service ? shopsForService(service, allShops) : []), [service, allShops]);
  const openShops = shops.filter((s) => isShopOpenNow(s));
  const ready = loadState === 'ready';

  // The only shop, and it's open: no list to pick from, straight to its products
  const direct = ready && shops.length === 1 && openShops.length === 1 ? openShops[0] : null;
  const shownMenu = service ? (menuShop ?? direct) : null;

  const pick = (shop: Shop) => {
    if (!isShopOpenNow(shop)) {
      showToast(`⚠️ ${shop.name} مغلق حالياً، بيفتح ${shop.time}`);
      return;
    }
    setMenuShop(shop);
  };

  const closeAll = () => {
    setMenuShop(null);
    closeShopService();
  };

  const showList = Boolean(service) && !shownMenu;

  return (
    <>
      {service && showList && (
        <Modal isOpen onClose={closeAll} title={`اختار المحل — ${service.name}`} emoji={service.emoji} maxWidth="520px">
          <div dir="rtl" className="text-right">
            {!ready && (
              <ul className="flex flex-col gap-2" aria-label="جاري التحميل">
                {[0, 1].map((i) => (
                  <li key={i} className="h-[68px] rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </ul>
            )}

            {ready && shops.length > 0 && (
              <>
                <p className="text-[13px] text-gray-600 mb-2">اختار المحل، وبعدين اختار المنتجات والعدد اللي عايزه.</p>
                <ul className="flex flex-col gap-2">
                  {shops.map((shop) => (
                    <li key={shop.id}>
                      <button
                        type="button"
                        onClick={() => pick(shop)}
                        aria-label={`التسوق من ${shop.name}`}
                        className={`w-full min-h-[64px] flex items-center gap-3 p-2.5 rounded-xl border text-right cursor-pointer ${
                          isShopOpenNow(shop) ? 'bg-white border-gray-200 hover:border-green' : 'bg-gray-50 border-gray-100 opacity-70'
                        }`}
                      >
                        <span
                          className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-[26px] overflow-hidden"
                          style={{ background: shop.bgColor || '#f9fafb' }}
                        >
                          {shop.photo ? (
                            <ProductPhoto photo={shop.photo} emoji={shop.emoji} className="w-12 h-12" />
                          ) : (
                            <span aria-hidden="true">{shop.emoji}</span>
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] font-bold truncate">{shop.name}</span>
                          <span className="block text-[12px] text-gray-600 truncate">{shop.description}</span>
                        </span>
                        <span
                          className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isShopOpenNow(shop) ? 'bg-green-50 text-green-dark' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isShopOpenNow(shop) ? 'فاتح' : `مقفول • ${shop.time}`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {ready && shops.length === 0 && (
              <div className="text-center py-6 px-2" data-testid="service-shops-empty">
                <p className="font-bold text-text mb-1">لسه مفيش محلات {service.name} على قريتي</p>
                <p className="text-[13px] text-gray-600 mb-3">
                  ابعتلنا اللي محتاجه في الرسايل، وخدمة العملاء هتتصرف وترد عليك.
                </p>
                <Link
                  to={ROUTES.messages}
                  onClick={closeAll}
                  className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-green text-white font-bold"
                >
                  كلّم خدمة العملاء
                </Link>
              </div>
            )}
          </div>
        </Modal>
      )}

      <ShopMenuPage shop={shownMenu} onClose={closeAll} />
    </>
  );
}
