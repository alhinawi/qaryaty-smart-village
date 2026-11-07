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
  /** People to pick from per service id (سباك، نجار…). */
  peopleCounts?: Record<number, number>;
}

// ─── Component
export function ServicesSection({
  services,
  onSelectService,
  onResetFilters,
  peopleCounts,
}: ServicesSectionProps) {
  const handleAllClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onResetFilters();
  };

  return (
    <section className="mb-6" aria-label="الخدمات المتاحة">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-extrabold text-text m-0">
          <span role="img" aria-hidden="true">
            ⚡
          </span>{' '}
          الخدمات المتاحة ({services.length})
        </h2>
        <a href="#all-services" onClick={handleAllClick} className="text-sm font-bold text-green no-underline">
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3" id="servicesGrid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={onSelectService}
              peopleCount={peopleCounts?.[service.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
