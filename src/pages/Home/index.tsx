// ─── Imports
import { useState, useMemo } from 'react';
import type { CategoryFilter, OrderModalData, Service } from '@/types';
import { CATEGORIES } from '@/data/categories';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';
import { useUIStore } from '@/stores/useUIStore';

// Subcomponents
import { Hero } from './Hero';
import { Stats } from './Stats';
import { CategoriesSection } from './CategoriesSection';
import { LiveOrderBanner } from './LiveOrderBanner';
import { ServicesSection } from './ServicesSection';
import { PromoBanner } from './PromoBanner';
import { ShopsSection } from './ShopsSection';
import { FeaturesSection } from './FeaturesSection';
import { SkeletonList } from '@/components/ui/Skeleton';
import { serviceToOrderModalData } from '@/utils/pricing';

// ─── Types
interface HomePageProps {
  onOpenOrderModal: (data: OrderModalData) => void;
}

// ─── Component
export default function HomePage({ onOpenOrderModal }: HomePageProps) {
  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const showToast = useUIStore((state) => state.showToast);

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull-to-refresh simulation handler
  const handlePullToRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('🔄 تم تحديث خدمات ومحلات القرية!');
    }, 600);
  };

  // Filtered Services logic
  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return SERVICES.filter((service) => {
      const matchesCategory =
        selectedCategory === 'all' || service.cat === selectedCategory;
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.desc.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectService = (service: Service) => {
    onOpenOrderModal(serviceToOrderModalData(service));
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="home-page-container">
      {/* Pull-to-Refresh Trigger Area */}
      <div className="flex justify-center mb-3 md:hidden">
        <button
          type="button"
          className={`bg-[rgba(26,122,74,0.08)] border border-[rgba(26,122,74,0.15)] rounded-xl  px-3.5 py-1.5 inline-flex items-center gap-1.5 font-['Cairo',sans-serif] text-[13px] text-green-dark font-bold cursor-pointer transition-all duration-200`}
          onClick={handlePullToRefresh}
          aria-label="تحديث الخدمات"
        >
          <span className={isRefreshing ? 'animate-[spin_0.8s_linear_infinite]' : ''}>🔄</span>
          <span>{isRefreshing ? 'جاري التحديث...' : 'سحب للتحديث'}</span>
        </button>
      </div>

      {/* Hero Banner */}
      <Hero onOpenOrder={onOpenOrderModal} />

      {/* Quick Statistics */}
      <Stats />

      {/* Categories Bar */}
      <CategoriesSection
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Live Order Pulse Widget */}
      <LiveOrderBanner />

      {/* Services Section with Skeleton Loading support */}
      {isRefreshing ? (
        <section className="services-section">
          <div className="section-header">
            <h3>⚡ جاري تحديث الخدمات...</h3>
          </div>
          <SkeletonList count={4} />
        </section>
      ) : (
        <ServicesSection
          services={filteredServices}
          onSelectService={handleSelectService}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Promo Banner */}
      <PromoBanner />

      {/* Village Shops Section */}
      <ShopsSection shops={SHOPS} onSelectShop={onOpenOrderModal} />

      {/* Why Choose Us Features */}
      <FeaturesSection />
    </div>
  );
}
