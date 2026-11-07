import { Link } from 'react-router';
import { CatalogShareButton } from './CatalogShareButton';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
// ─── Imports

import React, { useState } from "react";
import { imageForService } from "@/config/serviceImages";

import type { Service, ServiceCategory } from "@/types";

import { useUserStore } from "@/stores/useUserStore";

import { cartItemFromService } from "@/stores/useCartStore";
import { useAddToCart } from "@/hooks/useAddToCart";

import { useUIStore } from "@/stores/useUIStore";

// ─── Constants

const CATEGORY_BACKGROUNDS: Record<ServiceCategory, string> = {
  food: "#fef9ee",
  delivery: "#f0fdf4",
  craft: "#fff7ed",
  care: "#fdf4ff",
  edu: "#eff6ff",
  health: "#ecfeff",
  home: "#f5f3ff",
  finishing: "#fafaf9",
};

// ─── Types

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
  disableFeaturedLayout?: boolean;
  /** How many people the customer can pick from for this service. */
  peopleCount?: number;
}

// ─── Component

export const ServiceCard = React.memo(function ServiceCard({
  service,
  onSelect,
  disableFeaturedLayout = false,
  peopleCount,
}: ServiceCardProps) {
  const isFav = useUserStore((state) => state.isFavorite(service.id));

  const toggleFavorite = useUserStore((state) => state.toggleFavorite);

  const addToCart = useAddToCart();

  const showToast = useUIStore((state) => state.showToast);

  const [imageFailed, setImageFailed] = useState(false);
  const bg = CATEGORY_BACKGROUNDS[service.cat] || "#f9fafb";

  const isFeatured = service.featured && !disableFeaturedLayout;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    toggleFavorite(service.id);

    showToast(
      isFav
        ? `💔 تم إزالة ${service.name} من المفضلة`
        : `❤️ تم إضافة ${service.name} للمفضلة`,
    );
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Choices (subject, grade, hours) are made in the order form, not in the cart
    if (service.options?.length) {
      onSelect(service);
      return;
    }
    const item = cartItemFromService(service);
    if (!(await addToCart(item))) return;
    showToast(`🛒 تم إضافة ${service.name} إلى السلة!`);
  };

  return (
    <div
      className={`motion-card bg-white rounded-2xl overflow-hidden shadow-(--shadow-card) cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-[rgba(26,122,74,0.08)] relative text-right flex flex-col hover:-translate-y-1 hover:shadow-(--shadow-card-hover) ${
        isFeatured
          ? "max-lg:col-span-2 max-lg:flex-row max-lg:items-center"
          : ""
      }`}
    >
      <button type="button" className="absolute inset-0 z-10 rounded-2xl cursor-pointer border-0 bg-transparent focus-visible:outline-offset-[-3px]" onClick={() => onSelect(service)} aria-label={`طلب خدمة ${service.name}`} />
      {/* Service Image */}
      <div
        className={`h-[110px] flex items-center justify-center text-[48px] relative ${
          isFeatured
            ? "max-lg:w-[120px] max-lg:h-[120px] max-lg:shrink-0"
            : ""
        }`}
        style={{ background: bg }}
      >
        {!imageFailed && imageForService(service) ? (
          <img
            src={imageForService(service)}
            alt=""
            width={480}
            height={540}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <ImagePlaceholder className="w-full h-full" />
        )}

        <div className="absolute bottom-0 left-0 z-20"><CatalogShareButton compact kind="service" id={service.id} name={service.name} /></div>
        {/* Favorite Heart Button */}
        <button
          type="button"
          className={`absolute top-2 left-2 z-20 bg-white/85 border-none rounded-xl w-[44px] h-[44px] flex items-center justify-center text-[15px] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-transform duration-200 hover:scale-[1.15] ${
            isFav ? "is-active" : ""
          }`}
          onClick={handleFavoriteClick}
          aria-pressed={isFav}
          aria-label={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          {isFav ? "❤️" : "🤍"}
        </button>

        {/* Badge */}
        {service.badge && (
          <div
            className={`absolute top-2 right-2 text-[10px] font-extrabold px-[7px] py-[2px] rounded-xl ${
              service.badge === "new"
                ? "bg-danger text-white"
                : "bg-gold text-black"
            }`}
          >
            {service.badge === "popular" ? "🔥 الأكثر طلباً" : "جديد"}
          </div>
        )}
      </div>

      {/* Service Info */}
      <div className="p-3.5 flex-1 flex flex-col">
        <h3 className="text-[15px] font-extrabold mb-1 text-text">
          {service.name}
        </h3>

        <p className="text-xs text-text-muted leading-[1.4] mb-2.5 flex-1">
          {service.desc}
        </p>

        {peopleCount ? (
          <p className="text-[11px] font-bold text-green-dark mb-2 m-0">
            <span aria-hidden="true">👥</span> {peopleCount} تختار منهم
          </p>
        ) : null}

        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-green font-bold flex items-center gap-[3px]">
            ⏱️ {service.time}
          </div>

          {service.rating && <div className="text-xs text-amber-800 font-extrabold">
            ⭐ {service.rating}
          </div>}
        </div>

        <Link to={`/services/${service.id}`} onClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()} className="relative z-20 self-start inline-block text-[12px] text-green font-bold py-2">التفاصيل والآراء</Link>
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
          <div className="text-[13px] font-extrabold text-green-dark">
            {service.price}
          </div>

          {/* Services with required choices (المرحلة، ممرض/ممرضة…) go through the order form */}
          {service.options?.length ? (
            <button
              type="button"
              className="relative z-20 min-h-11 bg-[rgba(26,122,74,0.1)] text-green border-none py-1.5 px-2.5 rounded-xl text-xs font-extrabold font-['Cairo',sans-serif] cursor-pointer transition-all duration-200 hover:bg-green hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(service);
              }}
              aria-label={`اطلب ${service.name}`}
            >
              اطلب
            </button>
          ) : (
          <button
              type="button"
              className="relative z-20 min-h-11 bg-[rgba(26,122,74,0.1)] text-green border-none py-1.5 px-2.5 rounded-xl text-xs font-extrabold font-['Cairo',sans-serif] cursor-pointer transition-all duration-200 hover:bg-green hover:text-white"
              onClick={handleQuickAdd}
              aria-label={`إضافة ${service.name} للسلة`}
            >
              + إضافة
            </button>
          )}
        </div>
      </div>
    </div>
  );
});