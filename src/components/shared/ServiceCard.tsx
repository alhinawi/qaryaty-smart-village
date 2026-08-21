// ─── Imports
import React from 'react';
import type { Service, ServiceCategory } from '@/types';
import { useUserStore } from '@/stores/useUserStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';

// ─── Constants
const CATEGORY_BACKGROUNDS: Record<ServiceCategory, string> = {
  food: '#fef9ee',
  delivery: '#f0fdf4',
  craft: '#fff7ed',
  care: '#fdf4ff',
  edu: '#eff6ff',
};

// ─── Types
interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

// ─── Component
export const ServiceCard = React.memo(function ServiceCard({
  service,
  onSelect,
}: ServiceCardProps) {
  const isFav = useUserStore((state) => state.isFavorite(service.id));
  const toggleFavorite = useUserStore((state) => state.toggleFavorite);
  const addItemToCart = useCartStore((state) => state.addItem);
  const showToast = useUIStore((state) => state.showToast);

  const bg = CATEGORY_BACKGROUNDS[service.cat] || '#f9fafb';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(service.id);
    showToast(
      isFav
        ? `💔 تم إزالة ${service.name} من المفضلة`
        : `❤️ تم إضافة ${service.name} للمفضلة`
    );
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItemToCart(service);
    showToast(`🛒 تم إضافة ${service.name} إلى السلة!`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`bg-white rounded-[18px] overflow-hidden shadow-[var(--shadow-card)] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-[rgba(26,122,74,0.08)] relative text-right flex flex-col hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] ${service.featured ? ' max-lg:col-span-2 max-lg:flex-row max-lg:items-center' : ''}`}
      onClick={() => onSelect(service)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(service);
        }
      }}
      aria-label={`طلب خدمة ${service.name}`}
    >
      <div className={`h-[110px] flex items-center justify-center text-[48px] relative ${service.featured ? 'max-lg:w-[120px] max-lg:h-[120px] max-lg:shrink-0' : ''}`} style={{ background: bg }}>
        <span role="img" aria-hidden="true">
          {service.emoji}
        </span>

        {/* Favorite Heart Button */}
        <button
          type="button"
          className={`absolute top-2 left-2 bg-white/85 border-none rounded-full w-[30px] h-[30px] flex items-center justify-center text-[15px] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-transform duration-200 hover:scale-[1.15] ${isFav ? 'is-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {/* Badge */}
        {service.badge && (
          <div
            className={`absolute top-2 right-2 text-[10px] font-extrabold px-[7px] py-[2px] rounded-lg ${
              service.badge === 'new' ? 'bg-danger text-white' : 'bg-gold text-black'
            }`}
          >
            {service.badge === 'popular' ? '🔥 الأكثر طلباً' : '🆕 جديد'}
          </div>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col">
        <h4 className="text-[15px] font-extrabold mb-1 text-text">{service.name}</h4>
        <p className="text-xs text-text-muted leading-[1.4] mb-2.5 flex-1">{service.desc}</p>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-green font-bold flex items-center gap-[3px]">⏱️ {service.time}</div>
          <div className="text-xs text-gold font-extrabold">⭐ {service.rating}</div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
          <div className="text-[13px] font-extrabold text-green-dark">{service.price}</div>
          <button
            type="button"
            className="bg-[rgba(26,122,74,0.1)] text-green border-none py-1 px-2.5 rounded-lg text-xs font-extrabold font-['Cairo',sans-serif] cursor-pointer transition-all duration-200 hover:bg-green hover:text-white"
            onClick={handleQuickAdd}
            aria-label={`إضافة ${service.name} للسلة`}
          >
            + للسلة
          </button>
        </div>
      </div>
    </div>
  );
});
