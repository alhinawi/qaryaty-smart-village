// ─── Imports
import { useUserStore } from '@/stores/useUserStore';
import { useGoToTab } from '@/hooks/useTabNavigation';
import { useEffect } from 'react';
import { useCatalogStore } from '@/stores/useCatalogStore';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { OrderModalData, Service } from '@/types';
import { serviceToOrderModalData } from '@/utils/pricing';

// ─── Types
interface FavoritesPageProps {
  onOpenOrderModal: (data: OrderModalData) => void;
}

// ─── Component
export default function FavoritesPage({
  onOpenOrderModal,
}: FavoritesPageProps) {
  const favorites = useUserStore((state) => state.favorites);
  const setActiveTab = useGoToTab();
  const services = useCatalogStore((state) => state.services);
  const loadCatalog = useCatalogStore((state) => state.load);
  const isLoading = useCatalogStore((state) => state.loadState !== 'ready');

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const favoriteServices = services.filter((service) =>
    favorites.includes(service.id)
  );

  const handleSelectService = (service: Service) => {
    onOpenOrderModal(serviceToOrderModalData(service));
  };

  return (
    <div className="favorites-page-container">
      <div className="mb-6">
        <h2 className="text-[clamp(1.375rem,3vw,1.75rem)] font-black text-green-dark font-['Tajawal',sans-serif] mb-1">❤️ خدماتي المفضلة ({favoriteServices.length})</h2>
        <p className="text-sm text-text-muted">الخدمات والمحلات التي قمت بحفظها للوصول إليها وطلبها بسرعة</p>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : favoriteServices.length === 0 ? (
        <EmptyState
          emoji="💔"
          title="مفيش خدمات مفضلة!"
          description="لم تقم بإضافة أي خدمات للمفضلة بعد. اضغط على أيقونة القلب ❤️ على أي خدمة لحفظها هنا."
          actionText="تصفح الخدمات"
          onAction={() => setActiveTab('home')}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {favoriteServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={handleSelectService}
              disableFeaturedLayout
            />
          ))}
        </div>
      )}
    </div>
  );
}
