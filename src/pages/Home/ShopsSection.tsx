// ─── Imports
import React from 'react';
import type { OrderModalData, Shop } from '@/types';
import { ShopCard } from '@/components/shared/ShopCard';
import { useUIStore } from '@/stores/useUIStore';

// ─── Types
interface ShopsSectionProps {
  shops: Shop[];
  onSelectShop: (modalData: OrderModalData) => void;
}

// ─── Component
export function ShopsSection({ shops, onSelectShop }: ShopsSectionProps) {
  const showToast = useUIStore((state) => state.showToast);

  const handleAllShopsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    showToast('🏪 جميع محلات وسوبرماركت القرية متاحة أمامك');
  };

  return (
    <section className="shops-section" aria-label="محلات القرية">
      <div className="section-header">
        <h3>
          <span role="img" aria-hidden="true">
            🏪
          </span>{' '}
          محلات القرية
        </h3>
        <a href="#all-shops" onClick={handleAllShopsClick}>
          كل المحلات
        </a>
      </div>

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
