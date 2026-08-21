// ─── Imports
import React from 'react';
import type { OrderModalData, Shop } from '@/types';
import { useUIStore } from '@/stores/useUIStore';

// ─── Types
interface ShopCardProps {
  shop: Shop;
  onSelectShop: (modalData: OrderModalData) => void;
}

const CATEGORY_BACKGROUNDS: Record<string, string> = {
  supermarket: '#f0fdf4',
  pharmacy: '#eff6ff',
  bakery: '#fff7ed',
  default: '#f9fafb',
};


// ─── Component
export const ShopCard = React.memo(function ShopCard({
  shop,
  onSelectShop,
}: ShopCardProps) {
  const showToast = useUIStore((state) => state.showToast);
  const bg = shop.bgColor || CATEGORY_BACKGROUNDS.default;

  const handleClick = () => {
    if (!shop.open) {
      showToast(`⚠️ ${shop.name} مغلق حالياً، بيفتح ${shop.time}`);
      return;
    }
    // Set a generic shop item for the modal
    onSelectShop({
      name: `طلب من ${shop.name}`,
      desc: `اكتب اللي محتاجه من ${shop.name} والمندوب هيجيبهولك`,
      price: 'حسب الطلب',
      emoji: shop.emoji,
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="shrink-0 w-[150px] bg-white rounded-md overflow-hidden shadow-md cursor-pointer transition-all duration-200 border border-green/10 text-right lg:w-full hover:-translate-y-[3px] hover:shadow-lg"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`التسوق من ${shop.name}`}
    >
      <div className="h-[80px] flex items-center justify-center text-[38px]" style={{ background: bg }}>
        <span role="img" aria-hidden="true">
          {shop.emoji}
        </span>
      </div>
      <div className="p-2.5">
        <h5 className="text-sm font-extrabold mb-1 text-text">{shop.name}</h5>
        <div
          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md mb-1 ${
            shop.open ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
          }`}
        >
          {shop.open ? '🟢 مفتوح' : '🔴 مغلق'}
        </div>
        <div className="text-[11px] text-text-muted">⏱️ {shop.time}</div>
      </div>
    </div>
  );
});
