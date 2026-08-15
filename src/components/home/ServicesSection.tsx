// ─── Imports
import React from 'react';
import type { Service } from '@/types';
import { ServiceCard } from './ServiceCard';

// ─── Types
interface ServicesSectionProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  onResetFilters: () => void;
}

// ─── Render
export function ServicesSection({
  services,
  onSelectService,
  onResetFilters,
}: ServicesSectionProps) {
  const handleAllClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onResetFilters();
  };

  return (
    <section aria-label="الخدمات المتاحة">
      {/* Section Header */}
      <div className="section-header">
        <h3>
          <span role="img" aria-hidden="true">⚡</span>
          {' '}الخدمات المتاحة
        </h3>
        <a href="#all-services" onClick={handleAllClick}>
          الكل
        </a>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="services-empty">
          <span role="img" aria-hidden="true">🔍</span>
          <p>مفيش خدمات مطابقة لبحثك في الوقت الحالي</p>
        </div>
      ) : (
        <div className="services-grid" id="servicesGrid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelectService={onSelectService}
            />
          ))}
        </div>
      )}
    </section>
  );
}
