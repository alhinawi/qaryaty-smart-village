// ─── Imports
import React from 'react';
import type { OrderModalData, Shop } from '@/types';
import { ShopCard } from './ShopCard';

// ─── Types
interface ShopsSectionProps {
  shops: Shop[];
  onSelectShop: (modalData: OrderModalData) => void;
  onShowToast: (message: string) => void;
}

// ─── Render
export function ShopsSection({
  shops,
  onSelectShop,
  onShowToast,
}: ShopsSectionProps) {
  const handleAllShopsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onShowToast('🏪 جميع محلات القرية معروضة أمامك');
  };

  return (
    <section aria-label="محلات القرية">
      {/* Section Header */}
      <div className="section-header">
        <h3>
          <span role="img" aria-hidden="true">🏪</span>
          {' '}محلات القرية
        </h3>
        <a href="#all-shops" onClick={handleAllShopsClick}>
          كل المحلات
        </a>
      </div>

      {/* Horizontal Scroll Shops */}
      <div className="shops-scroll">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            onSelectShop={onSelectShop}
          />
        ))}
      </div>
    </section>
  );
}
