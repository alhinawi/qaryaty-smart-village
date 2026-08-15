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
      className={`service-card${service.featured ? ' featured' : ''}`}
      onClick={() => onSelect(service)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(service);
        }
      }}
      aria-label={`طلب خدمة ${service.name}`}
    >
      <div className="card-img" style={{ background: bg }}>
        <span role="img" aria-hidden="true">
          {service.emoji}
        </span>

        {/* Favorite Heart Button */}
        <button
          type="button"
          className={`card-fav-btn ${isFav ? 'is-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {/* Badge */}
        {service.badge && (
          <div
            className={`card-badge ${
              service.badge === 'new' ? 'new' : 'popular'
            }`}
          >
            {service.badge === 'popular' ? '🔥 الأكثر طلباً' : '🆕 جديد'}
          </div>
        )}
      </div>

      <div className="card-body">
        <h4>{service.name}</h4>
        <p>{service.desc}</p>
        <div className="card-meta">
          <div className="card-time">⏱️ {service.time}</div>
          <div className="card-rating">⭐ {service.rating}</div>
        </div>

        <div className="card-actions-row">
          <div className="card-price-tag">{service.price}</div>
          <button
            type="button"
            className="card-add-cart-btn"
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
