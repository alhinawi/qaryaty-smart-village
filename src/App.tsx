// ─── Imports
import React, { useRef, useState } from 'react';
import type {
  CategoryFilter,
  OrderFormData,
  OrderModalData,
  Service,
} from '@/types';
import { CATEGORIES } from '@/data/categories';
import { SERVICES } from '@/data/services';
import { SHOPS } from '@/data/shops';
import { useSplashScreen } from '@/hooks/useSplashScreen';

// Components
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { Hero } from '@/components/home/Hero';
import { Stats } from '@/components/home/Stats';
import { Categories } from '@/components/home/Categories';
import { LiveOrderBanner } from '@/components/home/LiveOrderBanner';
import { ServicesSection } from '@/components/home/ServicesSection';
import { PromoBanner } from '@/components/home/PromoBanner';
import { ShopsSection } from '@/components/home/ShopsSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { OrderModal } from '@/components/orders/OrderModal';
import { OrderSuccess } from '@/components/orders/OrderSuccess';
import { Toast } from '@/components/ui/Toast';

// ─── Constants
const INITIAL_FORM_DATA: OrderFormData = {
  address: '',
  phone: '',
  notes: '',
  paymentMethod: 'cash',
};

// ─── Component
export default function App() {
  // ─── State
  const { showSplash, isFadingOut, isAppVisible } = useSplashScreen();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const [modalData, setModalData] = useState<OrderModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<OrderFormData>(INITIAL_FORM_DATA);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Toast Handler
  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // ─── Derived State: Filtered Services
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredServices = SERVICES.filter((service) => {
    const matchesCategory =
      selectedCategory === 'all' || service.cat === selectedCategory;
    const matchesSearch =
      !normalizedQuery ||
      service.name.toLowerCase().includes(normalizedQuery) ||
      service.desc.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  });

  // ─── Modal Handlers
  const handleOpenModal = (data: OrderModalData) => {
    setModalData(data);
    setIsModalOpen(true);
  };

  const handleSelectService = (service: Service) => {
    handleOpenModal({
      emoji: service.emoji,
      name: service.name,
      desc: service.desc,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // ─── Form Handlers
  const handleFormChange = (fields: Partial<OrderFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleSubmitOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.address.trim() || !formData.phone.trim()) {
      showToast('⚠️ من فضلك اكمل بيانات العنوان والموبايل');
      return;
    }

    const generatedOrderNum = `#${Math.floor(Math.random() * 9000 + 1000)}`;
    setOrderNumber(generatedOrderNum);
    setIsModalOpen(false);
    setIsSuccessOpen(true);
  };

  const handleCloseSuccess = () => {
    setIsSuccessOpen(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  // ─── Render
  return (
    <>
      {/* Splash Screen */}
      {showSplash && <SplashScreen isFadingOut={isFadingOut} />}

      {/* Main Application Container */}
      <div
        id="app"
        className={`app-container${isAppVisible ? ' visible' : ''}`}
      >
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onShowToast={showToast}
        />

        {/* Main Content */}
        <main>
          {/* Hero Banner */}
          <Hero onOpenModal={handleOpenModal} />

          {/* Quick Stats */}
          <Stats />

          {/* Categories Horizontal Scroll */}
          <Categories
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Live Order Pulse Widget */}
          <LiveOrderBanner onShowToast={showToast} />

          {/* Services Grid Section */}
          <ServicesSection
            services={filteredServices}
            onSelectService={handleSelectService}
            onResetFilters={handleResetFilters}
          />

          {/* Promotional Banner */}
          <PromoBanner onShowToast={showToast} />

          {/* Village Shops Section */}
          <ShopsSection
            shops={SHOPS}
            onSelectShop={handleOpenModal}
            onShowToast={showToast}
          />

          {/* Why Choose Qaryati Features */}
          <FeaturesSection />
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          onOpenModal={handleOpenModal}
          onShowToast={showToast}
        />

        {/* Order Modal */}
        <OrderModal
          isOpen={isModalOpen}
          data={modalData}
          formData={formData}
          onFormChange={handleFormChange}
          onSubmit={handleSubmitOrder}
          onClose={handleCloseModal}
        />

        {/* Order Success Screen */}
        <OrderSuccess
          isOpen={isSuccessOpen}
          orderNumber={orderNumber}
          onClose={handleCloseSuccess}
        />

        {/* Global Toast Notifications */}
        <Toast message={toastMessage} />
      </div>
    </>
  );
}
