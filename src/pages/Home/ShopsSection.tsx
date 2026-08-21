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
    <section className="mb-6" aria-label="محلات القرية">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-extrabold text-text m-0">
          <span role="img" aria-hidden="true">
            🏪
          </span>{' '}
          محلات القرية
        </h3>
        <a href="#all-shops" onClick={handleAllShopsClick} className="text-sm font-bold text-green no-underline">
          كل المحلات
        </a>
      </div>

      <div className="flex gap-3.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-6 lg:overflow-x-visible">
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
