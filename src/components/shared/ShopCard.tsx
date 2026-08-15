// ─── Imports
import React from 'react';
import type { OrderModalData, Shop } from '@/types';

// ─── Types
interface ShopCardProps {
  shop: Shop;
  onSelectShop: (modalData: OrderModalData) => void;
}

// ─── Component
export const ShopCard = React.memo(function ShopCard({
  shop,
  onSelectShop,
}: ShopCardProps) {
  const handleClick = () => {
    onSelectShop({
      emoji: shop.emoji,
      name: shop.name,
      desc: shop.description,
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="shop-card"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`طلب من محل ${shop.name}`}
    >
      <div className="shop-img" style={{ background: shop.bgColor }}>
        <span role="img" aria-hidden="true">
          {shop.emoji}
        </span>
      </div>
      <div className="shop-body">
        <h5>{shop.name}</h5>
        <span className={`shop-open${shop.open ? '' : ' closed'}`}>
          {shop.open ? 'مفتوح ✓' : 'مغلق ✗'}
        </span>
        <div className="shop-time">{shop.time}</div>
      </div>
    </div>
  );
});
