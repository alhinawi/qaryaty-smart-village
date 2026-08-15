// ─── Imports
import React from 'react';
import type { Service } from '@/types';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Types
interface ServicesSectionProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

// ─── Component
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
    <section className="services-section" aria-label="الخدمات المتاحة">
      <div className="section-header">
        <h3>
          <span role="img" aria-hidden="true">
            ⚡
          </span>{' '}
          الخدمات المتاحة ({services.length})
        </h3>
        <a href="#all-services" onClick={handleAllClick}>
          الكل
        </a>
      </div>

      {services.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="مفيش خدمات مطابقة"
          description="لم نجد أي خدمات تطابق بحثك الحالي في القرية."
          actionText="عرض كل الخدمات"
          onAction={onResetFilters}
        />
      ) : (
        <div className="services-grid" id="servicesGrid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={onSelectService}
            />
          ))}
        </div>
      )}
    </section>
  );
}
