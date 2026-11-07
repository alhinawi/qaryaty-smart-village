import { interleaveShops } from '@/utils/interleaveShops';
// ─── Imports
import React, { useMemo, useState } from 'react';
import type { OrderModalData, Shop } from '@/types';
import { ShopCard } from '@/components/shared/ShopCard';
import { useUIStore } from '@/stores/useUIStore';
import { useProviderDashboardStore } from '@/stores/useProviderDashboardStore';
import { ShopMenuModal } from '@/components/modals/ShopMenuModal';
import { FOOD_TYPE_LABELS } from '@/data/catalog';

// ─── Types
interface ShopsSectionProps {
  shops: Shop[];
  onSelectShop: (modalData: OrderModalData) => void;
  /** true while the header search has text: shows a count and an empty message. */
  isSearching?: boolean;
  /** 'restaurants' shows the restaurants with food-type filters. */
  variant?: 'shops' | 'restaurants';
  /** Every card in a grid (the مطاعم chip) instead of one scrolling row. */
  showAll?: boolean;
  /** "كل المطاعم": opens the full list. */
  onShowAll?: () => void;
}

// ─── Component
export function ShopsSection({
  shops,
  onSelectShop,
  isSearching = false,
  variant = 'shops',
  showAll = false,
  onShowAll,
}: ShopsSectionProps) {
  const showToast = useUIStore((state) => state.showToast);
  // Same-device mirror of the merchant's «مشغول» toggle (mock mode); in live
  // mode the flag comes from the shop row itself.
  const merchantOverrides = useProviderDashboardStore((s) => s.merchants);
  const [menuShop, setMenuShop] = useState<Shop | null>(null);
  const [foodType, setFoodType] = useState<string | null>(null);
  const isRestaurants = variant === 'restaurants';
  const title = isRestaurants ? 'مطاعم القرية' : 'محلات القرية';
  const icon = isRestaurants ? '🍽️' : '🏪';

  const foodTypes = useMemo(
    () => (isRestaurants ? [...new Set(shops.flatMap((s) => s.foodTypes ?? []))] : []),
    [shops, isRestaurants]
  );
  const shown = foodType ? shops.filter((s) => s.foodTypes?.includes(foodType as never)) : (isRestaurants ? shops : interleaveShops(shops));

  const handleAllShopsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onShowAll) {
      onShowAll();
      return;
    }
    showToast(isRestaurants ? '🍽️ كل مطاعم القرية قدامك' : '🏪 كل محلات القرية قدامك');
  };

  return (
    <section className="mb-6 scroll-mt-20" aria-label={title} id={isRestaurants ? 'restaurants' : undefined}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-extrabold text-text m-0">
          <span role="img" aria-hidden="true">
            {icon}
          </span>{' '}
          {title}
          {isSearching ? ` (${shops.length})` : ''}
        </h2>
        {!showAll && (
          <a
            href={isRestaurants ? '#restaurants' : '#all-shops'}
            onClick={handleAllShopsClick}
            className="text-sm font-bold text-green no-underline py-2"
          >
            {isRestaurants ? `كل المطاعم (${shops.length.toLocaleString('ar-EG')})` : 'كل المحلات'}
          </a>
        )}
      </div>


      {foodTypes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none" aria-label="نوع الأكل">
          {[null, ...foodTypes].map((type) => (
            <button
              key={type ?? 'all'}
              type="button"
              aria-pressed={foodType === type}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-bold cursor-pointer border ${
                foodType === type ? 'bg-green text-white border-green' : 'bg-white text-gray-700 border-gray-200'
              }`}
              onClick={() => setFoodType(type)}
            >
              {type ? `${FOOD_TYPE_LABELS[type].emoji} ${FOOD_TYPE_LABELS[type].label}` : 'الكل'}
            </button>
          ))}
        </div>
      )}

      {shops.length === 0 && (
        <p className="text-sm text-text-muted bg-white rounded-xl p-4 text-center" role="status">
          {isRestaurants ? 'مفيش مطاعم بالاسم ده، جرّب كلمة تانية.' : 'مفيش محلات بالاسم ده، جرّب كلمة تانية.'}
        </p>
      )}

      <div
        className={
          showAll
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 [&>*]:w-full'
            : 'flex gap-3.5 overflow-x-auto pb-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-6 lg:overflow-x-visible'
        }
      >
        {shown.map((shop) => {
          // Same-device mirror of the merchant dashboard toggles; in live mode
          // the flags come from the shop row itself once they're server-backed.
          const override = merchantOverrides[shop.id];
          const shownShop = override
            ? {
                ...shop,
                ...(override.open !== undefined ? { open: override.open } : {}),
                ...(override.hours ? { time: override.hours } : {}),
                ...(override.busy !== undefined
                  ? { busy: override.busy, busyUntil: override.busyUntil ?? undefined }
                  : {}),
              }
            : shop;
          return (
          <ShopCard
            key={shop.id}
            shop={shownShop}
            onSelectShop={onSelectShop}
            onOpenMenu={setMenuShop}
          />
          );
        })}
      </div>

      <ShopMenuModal shop={menuShop} onClose={() => setMenuShop(null)} />
    </section>
  );
}
