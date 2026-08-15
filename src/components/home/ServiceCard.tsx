// ─── Imports
import type { Service, ServiceCategory } from '@/types';

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
  onSelectService: (service: Service) => void;
}

// ─── Render
export function ServiceCard({ service, onSelectService }: ServiceCardProps) {
  const bg = CATEGORY_BACKGROUNDS[service.cat] || '#f9fafb';

  return (
    <div
      role="button"
      tabIndex={0}
      className={`service-card${service.featured ? ' featured' : ''}`}
      onClick={() => onSelectService(service)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectService(service);
        }
      }}
      aria-label={`طلب خدمة ${service.name}`}
    >
      <div className="card-img" style={{ background: bg }}>
        <span role="img" aria-hidden="true">{service.emoji}</span>
        {service.badge && (
          <div className={`card-badge ${service.badge === 'new' ? 'new' : 'popular'}`}>
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
        <div className="card-price-tag">{service.price}</div>
      </div>
    </div>
  );
}
