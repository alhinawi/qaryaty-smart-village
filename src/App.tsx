// ─── Imports
import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { ROUTES } from '@/routes';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { useUIStore } from '@/stores/useUIStore';
import { useGoToTab } from '@/hooks/useTabNavigation';
import { useAuthStore } from '@/stores/useAuthStore';
import type { OrderModalData } from '@/types';

// Layout & Global Components
import { Header } from '@/components/layout/Header';
import { ServiceStatusBanner } from '@/components/layout/ServiceStatusBanner';
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
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));

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

  // Re-check the saved session once (the user may have been blocked or removed)
  useEffect(() => {
    void useAuthStore.getState().refresh();
  }, []);

  const setActiveTab = useGoToTab();
  const toastMessage = useUIStore((state) => state.toastMessage);

  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [modalData, setModalData] = useState<OrderModalData | null>(null);
  // Bumped on every open so OrderModal remounts with clean state (step, promo, notes)
  const [orderModalKey, setOrderModalKey] = useState(0);

  // Order Success Screen State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState('');

  const handleOpenOrderModal = (data: OrderModalData) => {
    setModalData(data);
    setOrderModalKey((key) => key + 1);
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

        {/* Supabase down or paused: sample data + clear message */}
        <ServiceStatusBanner />

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full pb-[calc(85px+env(safe-area-inset-bottom))] lg:pb-10">
          <PageWrapper>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route
                  path={ROUTES.home}
                  element={<HomePage onOpenOrderModal={handleOpenOrderModal} />}
                />
                <Route path={ROUTES.orders} element={<OrdersPage />} />
                <Route
                  path={ROUTES.favorites}
                  element={<FavoritesPage onOpenOrderModal={handleOpenOrderModal} />}
                />
                <Route path={ROUTES.messages} element={<MessagesPage />} />
                <Route path={ROUTES.profile} element={<ProfilePage />} />
                <Route path={ROUTES.login} element={<LoginPage />} />
                <Route path={ROUTES.register} element={<RegisterPage />} />
                {/* Unknown URLs go home instead of a blank page */}
                <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
              </Routes>
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
          key={orderModalKey}
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
