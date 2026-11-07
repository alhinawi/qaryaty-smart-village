// ─── Imports
import { useEffect, useState, useMemo } from 'react';
import type {
  CategoryFilter,
  OrderModalData,
  Provider,
  ProviderKind,
  SchoolStage,
  Service,
  ServiceCategory,
  TeacherGroup,
  TeacherSubject,
} from '@/types';
import { CATEGORIES } from '@/data/categories';
import { useUIStore } from '@/stores/useUIStore';
import { useCatalogStore } from '@/stores/useCatalogStore';

// Subcomponents
import { Hero } from './Hero';
import { CategoriesSection } from './CategoriesSection';
import { LiveOrderBanner } from './LiveOrderBanner';
import { ServicesSection } from './ServicesSection';
import { PromoBanner } from './PromoBanner';
import { ShopsSection } from './ShopsSection';
import { productsForShop } from '@/data/catalog';
import { ProvidersSection } from './ProvidersSection';
import { PeopleSectionsRow } from './PeopleSectionsRow';
import { DonationsBanner } from './DonationsBanner';
import { JobsBanner } from './JobsBanner';
import { JOB_SEARCH_WORDS } from '@/config/jobs';
import { MarketBanner } from './MarketBanner';
import { MARKET_SEARCH_WORDS } from '@/config/market';
import { RidesBanner } from './RidesBanner';
import { RIDE_SEARCH_WORDS } from '@/config/rides';
import { DONATION_SEARCH_FIELDS } from '@/config/donations';
import { ProviderPickerModal } from './ProviderPickerModal';
import { FeaturesSection } from './FeaturesSection';
import { SkeletonList } from '@/components/ui/Skeleton';
import { providerToOrderModalData, serviceToOrderModalData } from '@/utils/pricing';
import { groupPreselection } from '@/utils/teacherGroups';
import { matchesSearch } from '@/utils/arabicSearch';
import {
  PEOPLE_SECTIONS,
  filterProviders,
  gridServices,
  providersForService,
  quickRequestServices,
  sectionCounts,
  sectionForCategory,
} from '@/utils/peopleSections';

/** Search results on الكل: how many people to show per section before "عرض الكل". */
const SEARCH_PREVIEW = 4;

// ─── Types
interface HomePageProps {
  onOpenOrderModal: (data: OrderModalData) => void;
}

// ─── Component
export default function HomePage({ onOpenOrderModal }: HomePageProps) {
  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const showToast = useUIStore((state) => state.showToast);

  const [selectedCategory, setSelectedCategoryState] =
    useState<CategoryFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const services = useCatalogStore((state) => state.services);
  const shops = useCatalogStore((state) => state.shops);
  const providers = useCatalogStore((state) => state.providers);
  const loadState = useCatalogStore((state) => state.loadState);
  const loadCatalog = useCatalogStore((state) => state.load);
  const isLoading = isRefreshing || loadState !== 'ready';

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);
  const [subject, setSubject] = useState<TeacherSubject | 'all'>('all');
  const [stage, setStage] = useState<SchoolStage | 'all'>('all');
  const [kind, setKind] = useState<ProviderKind | 'all'>('all');
  const peopleSection = sectionForCategory(selectedCategory);
  const isSearching = searchQuery.trim().length > 0;
  const isRestaurantsCategory = selectedCategory === 'restaurants';
  /** Restaurants sit near the top on الكل and under the مطاعم chip; search results keep them lower down. */
  const restaurantsOnTop = isRestaurantsCategory || (selectedCategory === 'all' && !isSearching);

  const setSelectedCategory = (category: CategoryFilter) => {
    setSelectedCategoryState(category);
    setKind('all');
  };

  /** Open a people section from its tile or from "عرض الكل" and scroll to it. */
  const openSection = (category: ServiceCategory) => {
    setSelectedCategory(category);
    requestAnimationFrame(() =>
      document.getElementById(`people-${category}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  // Pull to refresh: reload the catalog through the repository
  const handlePullToRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await loadCatalog(true);
    setIsRefreshing(false);
    showToast('🔄 تم تحديث خدمات ومحلات القرية!');
  };

  // Services grid: teachers, doctors, nurses… are not repeated here; they live in their own section.
  // Search is Arabic-aware (ignores tashkeel, hamza forms, ة/ه, ى/ي).
  const filteredServices = useMemo(() => {
    return gridServices(services, providers).filter((service) => {
      const matchesCategory =
        selectedCategory === 'all' || service.cat === selectedCategory;
      return matchesCategory && matchesSearch(searchQuery, [service.name, service.desc, ...(service.keywords ?? [])]);
    });
  }, [services, providers, searchQuery, selectedCategory]);

  // Shops and restaurants are searched too: by name, description and what they sell
  const filteredShops = useMemo(
    () =>
      shops.filter((shop) =>
        matchesSearch(searchQuery, [
          shop.name,
          shop.description,
          ...(productsForShop(shop)?.map((p) => p.name) ?? []),
        ])
      ),
    [shops, searchQuery]
  );
  const villageShops = useMemo(() => filteredShops.filter((s) => s.kind !== 'restaurant'), [filteredShops]);
  const restaurants = useMemo(() => filteredShops.filter((s) => s.kind === 'restaurant'), [filteredShops]);

  // People in the selected category's section (teachers, nurses…), with its filters
  const filteredProviders = useMemo(() => {
    if (!peopleSection) return [];
    return filterProviders(providers, services, {
      kinds: peopleSection.kinds,
      kind,
      subject,
      stage,
      query: searchQuery,
    });
  }, [providers, services, peopleSection, kind, subject, stage, searchQuery]);

  const quickServices = useMemo(
    () => (peopleSection ? quickRequestServices(peopleSection, services, providers) : []),
    [peopleSection, services, providers]
  );

  // Searching from الكل: people who match, grouped by section
  const searchPeople = useMemo(() => {
    if (selectedCategory !== 'all' || !isSearching) return [];
    return PEOPLE_SECTIONS.map((section) => ({
      section,
      providers: filterProviders(providers, services, { kinds: section.kinds, query: searchQuery }),
    })).filter((group) => group.providers.length > 0);
  }, [selectedCategory, isSearching, providers, services, searchQuery]);

  const counts = useMemo(() => sectionCounts(providers, services), [providers, services]);
  const peopleCounts = useMemo(() => {
    const byService: Record<number, number> = {};
    for (const service of services) {
      const n = providersForService(service, providers).length;
      if (n) byService[service.id] = n;
    }
    return byService;
  }, [services, providers]);

  // Hide an empty services grid when a people section is on screen (it has its own empty message)
  const showServicesGrid =
    !isRestaurantsCategory && (filteredServices.length > 0 || (!peopleSection && searchPeople.length === 0));

  const openRestaurants = () => {
    setSelectedCategory('restaurants');
    requestAnimationFrame(() =>
      document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  const restaurantsSection = (
    <ShopsSection
      variant="restaurants"
      shops={restaurants}
      isSearching={isSearching}
      onSelectShop={onOpenOrderModal}
      showAll={isRestaurantsCategory}
      onShowAll={openRestaurants}
    />
  );

  const handleBookProvider = (provider: Provider, group?: TeacherGroup) => {
    const service = services.find((s) => s.id === provider.serviceId);
    onOpenOrderModal(providerToOrderModalData(provider, service, group && groupPreselection(group)));
  };

  const handleSelectService = (service: Service) => {
    onOpenOrderModal(serviceToOrderModalData(service));
  };

  // A service in the grid with people listed (سباك، نجار…): pick who comes first
  const [pickerService, setPickerService] = useState<Service | null>(null);
  const pickerProviders = useMemo(
    () => (pickerService ? providersForService(pickerService, providers) : []),
    [pickerService, providers]
  );
  const handleGridService = (service: Service) => {
    if (providersForService(service, providers).length > 0) setPickerService(service);
    else handleSelectService(service);
  };
  const handlePick = (provider: Provider) => {
    setPickerService(null);
    handleBookProvider(provider);
  };
  const handlePickAnyone = (service: Service) => {
    setPickerService(null);
    handleSelectService(service);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSubject('all');
    setStage('all');
    setKind('all');
  };

  return (
    <div className="home-page-container">
      {/* Categories Bar */}
      <CategoriesSection
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <Hero onSelectService={serviceId => { const service = services.find(item => item.id === serviceId); if (service) handleGridService(service); }} />
      <div className="flex items-center justify-between mb-5 px-1">
        <div><span className="text-[10px] text-text-muted block">من أهل القرية، لأهل القرية</span><p className="text-[13px] font-extrabold text-green-dark">كل اللي محتاجه، قريب منك</p></div>
        <button type="button" onClick={() => void handlePullToRefresh()} className="text-xs text-green font-bold">{isRefreshing ? 'بنحدّث...' : 'تحديث الخدمات'}</button>
      </div>
      {/* Live Order Pulse Widget */}
      <LiveOrderBanner />

      {isLoading && (
        <section className="services-section">
          <div className="section-header">
            <h3>⚡ {isRefreshing ? 'بنحدّث الخدمات...' : 'بنحمّل الخدمات...'}</h3>
          </div>
          <SkeletonList count={4} />
        </section>
      )}

      {/* One tile per people section (المدرسين، الدكاترة والتمريض…) */}
      {!isLoading && selectedCategory === 'all' && !isSearching && (
        <PeopleSectionsRow counts={counts} onOpen={openSection} />
      )}

      {/* وظائف: on الكل, or when the search is about work (وظيفة، شغل…) */}
      {selectedCategory === 'all' && (!isSearching || matchesSearch(searchQuery, JOB_SEARCH_WORDS)) && <JobsBanner />}

      {/* بيع المستعمل وتبادل: on الكل, or when the search is about buying, selling or swapping */}
      {selectedCategory === 'all' && (!isSearching || matchesSearch(searchQuery, MARKET_SEARCH_WORDS)) && <MarketBanner />}

      {/* شير مواصلة: on الكل, or when the search is about getting somewhere (مواصلات، شير، توصيلة، عربية…) */}
      {selectedCategory === 'all' && (!isSearching || matchesSearch(searchQuery, RIDE_SEARCH_WORDS)) && <RidesBanner />}

      {/* Restaurants: near the top so they're easy to find */}
      {!isLoading && restaurantsOnTop && restaurantsSection}

      {/* The selected category's people, all in one section, with its filters */}
      {!isLoading && peopleSection && (
        <ProvidersSection
          section={peopleSection}
          providers={filteredProviders}
          onBook={handleBookProvider}
          showFilters
          subject={subject}
          onSubjectChange={setSubject}
          stage={stage}
          onStageChange={setStage}
          kind={kind}
          onKindChange={setKind}
          quickServices={quickServices}
          onQuickRequest={handleSelectService}
        />
      )}

      {!isLoading && showServicesGrid && (
        <ServicesSection
          services={filteredServices}
          onSelectService={handleGridService}
          peopleCounts={peopleCounts}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Searching from الكل: matching people, a few per section */}
      {!isLoading &&
        searchPeople.map(({ section, providers: matches }) => (
          <ProvidersSection
            key={section.id}
            section={section}
            providers={matches}
            onBook={handleBookProvider}
            maxVisible={SEARCH_PREVIEW}
            onShowAll={() => openSection(section.id)}
          />
        ))}

      {/* باب الخير: on الكل, or when the search is about giving (تبرع، زكاة، بيت المال…) */}
      {selectedCategory === 'all' &&
        (!isSearching || matchesSearch(searchQuery, [...DONATION_SEARCH_FIELDS])) && <DonationsBanner />}

      {/* Promo Banner */}
      {!isRestaurantsCategory && <PromoBanner />}

      {/* Village Shops Section */}
      {!isLoading && !isRestaurantsCategory && (
        <ShopsSection shops={villageShops} isSearching={isSearching} onSelectShop={onOpenOrderModal} />
      )}
      {!isLoading && !restaurantsOnTop && restaurantsSection}

      {/* Why Choose Us Features */}
      <FeaturesSection />

      <ProviderPickerModal
        service={pickerService}
        providers={pickerProviders}
        onPick={handlePick}
        onAnyone={handlePickAnyone}
        onClose={() => setPickerService(null)}
      />
    </div>
  );
}
