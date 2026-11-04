// ─── Imports
import { useState, useMemo } from 'react';
import type {
  CategoryFilter,
  OrderModalData,
  Provider,
  ProviderKind,
  SchoolStage,
  Service,
  TeacherSubject,
} from '@/types';
import { CATEGORIES } from '@/data/categories';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';
import { PROVIDERS } from '@/data/providers';
import { SUBJECT_LABELS } from '@/data/teachers';
import { useUIStore } from '@/stores/useUIStore';

// Subcomponents
import { Hero } from './Hero';
import { Stats } from './Stats';
import { CategoriesSection } from './CategoriesSection';
import { LiveOrderBanner } from './LiveOrderBanner';
import { ServicesSection } from './ServicesSection';
import { PromoBanner } from './PromoBanner';
import { ShopsSection } from './ShopsSection';
import { ProvidersSection } from './ProvidersSection';
import { FeaturesSection } from './FeaturesSection';
import { SkeletonList } from '@/components/ui/Skeleton';
import { providerToOrderModalData, serviceToOrderModalData } from '@/utils/pricing';
import { matchesSearch } from '@/utils/arabicSearch';

// ─── Which people show under each category
const PROVIDER_KINDS: Partial<Record<CategoryFilter, { kinds: ProviderKind[]; title: string }>> = {
  edu: { kinds: ['teacher'], title: '👩‍🏫 المدرسين' },
  health: { kinds: ['doctor', 'nurse'], title: '🩺 الدكاترة والتمريض' },
  care: { kinds: ['babysitter'], title: '❤️ جليسات الأطفال' },
  home: { kinds: ['cleaner'], title: '🧹 عمال وعاملات النظافة' },
};

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
  const [subject, setSubject] = useState<TeacherSubject | 'all'>('all');
  const [stage, setStage] = useState<SchoolStage | 'all'>('all');
  const providerGroup = PROVIDER_KINDS[selectedCategory];

  // Pull-to-refresh simulation handler
  const handlePullToRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('🔄 تم تحديث خدمات ومحلات القرية!');
    }, 600);
  };

  // Filtered Services logic (Arabic-aware: ignores tashkeel, hamza forms, ة/ه, ى/ي)
  const filteredServices = useMemo(() => {
    return SERVICES.filter((service) => {
      const matchesCategory =
        selectedCategory === 'all' || service.cat === selectedCategory;
      return matchesCategory && matchesSearch(searchQuery, [service.name, service.desc]);
    });
  }, [searchQuery, selectedCategory]);

  // Shops are searched too, by name and description
  const filteredShops = useMemo(
    () => SHOPS.filter((shop) => matchesSearch(searchQuery, [shop.name, shop.description])),
    [searchQuery]
  );

  // People for the selected category (teachers, nurses…), with teacher filters
  const filteredProviders = useMemo(() => {
    if (!providerGroup) return [];
    return PROVIDERS.filter((provider) => {
      if (!provider.active || !providerGroup.kinds.includes(provider.kind)) return false;
      if (provider.kind === 'teacher') {
        if (subject !== 'all' && provider.subject !== subject) return false;
        // No stages listed (e.g. Quran) means all ages
        if (stage !== 'all' && provider.stages && !provider.stages.includes(stage)) return false;
      }
      const subjectLabel = provider.subject ? SUBJECT_LABELS[provider.subject] : '';
      return matchesSearch(searchQuery, [provider.name, provider.bio, provider.area, subjectLabel, provider.specialty ?? '']);
    });
  }, [providerGroup, subject, stage, searchQuery]);

  const handleBookProvider = (provider: Provider) => {
    const service = SERVICES.find((s) => s.id === provider.serviceId);
    onOpenOrderModal(providerToOrderModalData(provider, service));
  };

  const handleSelectService = (service: Service) => {
    onOpenOrderModal(serviceToOrderModalData(service));
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSubject('all');
    setStage('all');
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

      {/* Teachers, nurses, doctors… for the selected category */}
      {providerGroup && !isRefreshing && (
        <ProvidersSection
          title={providerGroup.title}
          providers={filteredProviders}
          onBook={handleBookProvider}
          showTeacherFilters={selectedCategory === 'edu'}
          subject={subject}
          onSubjectChange={setSubject}
          stage={stage}
          onStageChange={setStage}
        />
      )}

      {/* Promo Banner */}
      <PromoBanner />

      {/* Village Shops Section */}
      <ShopsSection
        shops={filteredShops}
        isSearching={searchQuery.trim().length > 0}
        onSelectShop={onOpenOrderModal}
      />

      {/* Why Choose Us Features */}
      <FeaturesSection />
    </div>
  );
}
