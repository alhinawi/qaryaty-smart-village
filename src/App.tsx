// ─── Imports
import { Suspense, lazy, useState } from 'react';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { useUIStore } from '@/stores/useUIStore';
import type { OrderModalData } from '@/types';

// Layout & Global Components
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { NotificationsDrawer } from '@/components/layout/NotificationsDrawer';
import { OrderModal } from '@/components/orders/OrderModal';
import { OrderSuccess } from '@/components/orders/OrderSuccess';
import { RatingModal } from '@/components/shared/RatingModal';
import { Toast } from '@/components/ui/Toast';

// ─── Lazy Loaded Pages
const HomePage = lazy(() => import('@/pages/Home'));
const OrdersPage = lazy(() => import('@/pages/Orders'));
const FavoritesPage = lazy(() => import('@/pages/Favorites'));
const MessagesPage = lazy(() => import('@/pages/Messages'));
const ProfilePage = lazy(() => import('@/pages/Profile'));

// ─── Page Loading Fallback
function PageLoadingFallback() {
  return (
    <div className="page-loading-spinner-container" aria-label="جاري التحميل...">
      <div className="q-spinner-large" />
      <p>جاري تحميل الصفحة...</p>
    </div>
  );
}

// ─── Component
export default function App() {
  const { showSplash, isFadingOut, isAppVisible } = useSplashScreen();

  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const toastMessage = useUIStore((state) => state.toastMessage);

  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [modalData, setModalData] = useState<OrderModalData | null>(null);

  // Order Success Screen State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState('');

  const handleOpenOrderModal = (data: OrderModalData) => {
    setModalData(data);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setModalData(null);
  };

  const handleOrderSuccess = (orderNumber: string) => {
    setSuccessOrderNumber(orderNumber);
    setIsSuccessOpen(true);
  };

  const handleCloseSuccess = () => {
    setIsSuccessOpen(false);
  };

  const handleViewOrdersFromSuccess = () => {
    setIsSuccessOpen(false);
    setActiveTab('orders');
  };

  return (
    <>
      {/* Splash Screen */}
      {showSplash && <SplashScreen isFadingOut={isFadingOut} />}

      {/* Main Application */}
      <div
        id="app"
        className={`app-root-layout${isAppVisible ? ' visible' : ''}`}
      >
        {/* Responsive Header */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="app-main-content">
          <PageWrapper>
            <Suspense fallback={<PageLoadingFallback />}>
              {activeTab === 'home' && (
                <HomePage onOpenOrderModal={handleOpenOrderModal} />
              )}
              {activeTab === 'orders' && <OrdersPage />}
              {activeTab === 'favorites' && (
                <FavoritesPage onOpenOrderModal={handleOpenOrderModal} />
              )}
              {activeTab === 'messages' && <MessagesPage />}
              {activeTab === 'profile' && <ProfilePage />}
            </Suspense>
          </PageWrapper>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav onOpenQuickOrder={handleOpenOrderModal} />

        {/* Global Cart Drawer */}
        <CartDrawer />

        {/* Global Notifications Drawer */}
        <NotificationsDrawer />

        {/* Order Modal Flow */}
        <OrderModal
          isOpen={isOrderModalOpen}
          data={modalData}
          onClose={handleCloseOrderModal}
          onSuccess={handleOrderSuccess}
        />

        {/* Order Success Screen */}
        <OrderSuccess
          isOpen={isSuccessOpen}
          orderNumber={successOrderNumber}
          onClose={handleCloseSuccess}
          onViewOrders={handleViewOrdersFromSuccess}
        />

        {/* 5-Star Rating Modal */}
        <RatingModal />

        {/* Floating Global Toast Notification */}
        <Toast message={toastMessage} />
      </div>
    </>
  );
}
