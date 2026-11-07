import { Link } from 'react-router';
import { CatalogShareButton } from './CatalogShareButton';
// ─── Imports
import React from "react";
import type { OrderModalData, Shop } from "@/types";
import { isShopBusy } from "@/utils/shopBusy";
import { useUIStore } from "@/stores/useUIStore";
import { productsForShop } from "@/data/catalog";
import { ProductPhoto } from "@/components/ui/ProductPhoto";

// ─── Types
interface ShopCardProps {
  shop: Shop;
  onSelectShop: (modalData: OrderModalData) => void;
  /** Opens the shop's product list; shops without one take a free-text order. */
  onOpenMenu?: (shop: Shop) => void;
}

const CATEGORY_BACKGROUNDS: Record<string, string> = {
  supermarket: "#f0fdf4",
  pharmacy: "#eff6ff",
  bakery: "#fff7ed",
  default: "#f9fafb",
};

// ─── Component
export const ShopCard = React.memo(function ShopCard({
  shop,
  onSelectShop,
  onOpenMenu,
}: ShopCardProps) {
  const showToast = useUIStore((state) => state.showToast);
  const bg = shop.bgColor || CATEGORY_BACKGROUNDS.default;

  const handleClick = () => {
    if (!shop.open) {
      showToast(`⚠️ ${shop.name} مغلق حالياً، بيفتح ${shop.time}`);
      return;
    }
    // Restaurants always open their menu (it loads through the repository)
    if (onOpenMenu && (shop.kind === "restaurant" || productsForShop(shop))) {
      onOpenMenu(shop);
      return;
    }
    // No product list (a salon, a workshop): write what you need
    onSelectShop({
      name: `طلب من ${shop.name}`,
      desc: `اكتب اللي محتاجه من ${shop.name} والمندوب هيجيبهولك`,
      price: "حسب الطلب",
      emoji: shop.emoji,
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="motion-card relative shrink-0 w-[150px] bg-white rounded-2xl overflow-hidden shadow-md cursor-pointer transition-all duration-200 border border-green/10 text-right lg:w-full hover:translate-y-[-3px] hover:shadow-lg"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`التسوق من ${shop.name}`}
    >
      <div className="absolute top-10 left-0 z-10"><CatalogShareButton compact kind="shop" id={shop.id} name={shop.name} /></div>
      {shop.photo ? (
        <div className="relative h-[90px]" style={{ background: bg }}>
          {!shop.demo && shop.open && isShopBusy(shop) && (
            <span
              className="absolute top-2 -start-6 rotate-[-45deg] bg-gold text-black text-[10px] font-black px-6 py-0.5 shadow-sm z-10"
              aria-label="المحل مشغول"
            >
              مشغول
            </span>
          )}
          <ProductPhoto
            photo={shop.photo}
            emoji={shop.emoji}
            className="w-full h-full"
            emojiClassName="text-[38px]"
          />
          <span
            className="absolute bottom-1.5 start-1.5 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-[18px]"
            aria-hidden="true"
          >
            {shop.emoji}
          </span>
        </div>
      ) : (
        <div
          className="relative h-[80px] flex items-center justify-center text-[38px]"
          style={{ background: bg }}
        >
          {!shop.demo && shop.open && isShopBusy(shop) && (
            <span
              className="absolute top-2 -start-6 rotate-[-45deg] bg-gold text-black text-[10px] font-black px-6 py-0.5 shadow-sm z-10"
              aria-label="المحل مشغول"
            >
              مشغول
            </span>
          )}
          <span role="img" aria-hidden="true">
            {shop.emoji}
          </span>
        </div>
      )}
      <div className="p-2.5">
        <h5 className="text-sm font-extrabold mb-1 text-text">{shop.name}</h5><Link to={`/shops/${shop.id}`} onClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()} className="inline-block text-[11px] text-green font-bold py-2">التفاصيل والآراء</Link>
        {shop.kind === "restaurant" && (
          <p className="text-[11px] text-text-muted leading-snug mb-1 line-clamp-2">
            {shop.description}
          </p>
        )}
        {!shop.demo && <div
          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-xl mb-1 ${
            shop.open ? "bg-green-50 text-success" : "bg-red-50 text-danger"
          }`}
        >
          {shop.open ? "🟢 مفتوح" : "🔴 مغلق"}
        </div>}
        {shop.time && <div className="text-[11px] text-text-muted">{shop.time}</div>}
        {shop.kind === "restaurant" && (shop.rating || shop.deliveryTime) && (
          <div className="text-[11px] text-text-muted mt-0.5 flex flex-wrap gap-x-2">
            {shop.rating ? <span className="font-bold text-amber-600">⭐ {shop.rating.toFixed(1)}</span> : null}
            {shop.deliveryTime ? <span>🛵 {shop.deliveryTime}</span> : null}
          </div>
        )}
        {(shop.kind === "restaurant" || shop.demo) && shop.village && (
          <div className="text-[11px] text-text-muted truncate">📍 {shop.village}</div>
        )}
      </div>
    </div>
  );
});
