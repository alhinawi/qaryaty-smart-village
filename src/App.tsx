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
    <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-4" aria-label="جاري التحميل...">
      <div className="w-10 h-10 border-4 border-[rgba(26,122,74,0.15)] border-t-green rounded-full animate-[spin_0.8s_linear_infinite]" />
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
        className={`w-full min-h-svh flex flex-col ${isAppVisible ? 'visible' : ''}`}
      >
        {/* Responsive Header */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full pb-[calc(85px+env(safe-area-inset-bottom))] md:pb-10">
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
