// ─── Imports
import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { ROUTES } from '@/routes';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { useUIStore } from '@/stores/useUIStore';
import { useGoToTab } from '@/hooks/useTabNavigation';
import { useAuthStore } from '@/stores/useAuthStore';
import type { OrderModalData } from '@/types';
import { readPaymentReturn } from '@/services/payments';
import { ensureProfileForOrder } from '@/stores/useProfilePromptStore';
import { CompleteProfileSheet } from '@/components/auth/CompleteProfileSheet';

// Layout & Global Components
import { Header } from '@/components/layout/Header';
import { ServiceStatusBanner } from '@/components/layout/ServiceStatusBanner';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { NotificationsDrawer } from '@/components/layout/NotificationsDrawer';
import { OrderModal } from '@/components/orders/OrderModal';
import { OrderSuccess } from '@/components/orders/OrderSuccess';
import { RatingModal } from '@/components/shared/RatingModal';
import { Toast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { preloadSearchScreen } from '@/components/search/loadSearchScreen';

// ─── Lazy Loaded Pages
const HomePage = lazy(() => import('@/pages/Home'));
const OrdersPage = lazy(() => import('@/pages/Orders'));
const FavoritesPage = lazy(() => import('@/pages/Favorites'));
const MessagesPage = lazy(() => import('@/pages/Messages'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));
const AuthCallbackPage = lazy(() => import('@/pages/Auth/AuthCallbackPage'));
const CompleteProfilePage = lazy(() => import('@/pages/Auth/CompleteProfilePage'));
const AboutPage = lazy(() => import('@/pages/About'));
const GroupsPage = lazy(() => import('@/pages/Groups'));
const SearchScreen = lazy(() => preloadSearchScreen().then((m) => ({ default: m.SearchScreen })));
const DonatePage = lazy(() => import('@/pages/Donate'));
const JobsPage = lazy(() => import('@/pages/Jobs'));
const JobDetailPage = lazy(() => import('@/pages/Jobs/JobDetailPage'));
const JobFormPage = lazy(() => import('@/pages/Jobs/JobFormPage'));
const MyJobsPage = lazy(() => import('@/pages/Jobs/MyJobsPage'));
const JobsReviewPage = lazy(() => import('@/pages/Jobs/JobsReviewPage'));
const MarketListPage = lazy(() => import('@/pages/Market/ListPage'));
const MarketItemPage = lazy(() => import('@/pages/Market/ItemPage'));
const MarketFormPage = lazy(() => import('@/pages/Market/FormPage'));
const MarketMinePage = lazy(() => import('@/pages/Market/MinePage'));
const MarketChatPage = lazy(() => import('@/pages/Market/ChatPage'));
const MarketReviewPage = lazy(() => import('@/pages/Market/ReviewPage'));
const RidesPage = lazy(() => import('@/pages/Rides'));
const RideDetailPage = lazy(() => import('@/pages/Rides/RideDetailPage'));
const RideFormPage = lazy(() => import('@/pages/Rides/RideFormPage'));
const MyRidesPage = lazy(() => import('@/pages/Rides/MyRidesPage'));
const RidesReviewPage = lazy(() => import('@/pages/Rides/RidesReviewPage'));
const AdminPage = lazy(() => import('@/pages/Admin'));
const ProviderDashboardPage = lazy(() => import('@/pages/Dashboard'));

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
/** The search screen's frame while its code arrives (first open on a slow connection). */
function SearchLoadingFallback() {
  return (
    <div className="fixed inset-0 z-[190] bg-cream lg:bg-black/45" aria-busy="true" aria-label="البحث بيحمّل">
      <div className="h-[112px] bg-linear-to-br from-green-dark to-green lg:hidden" />
    </div>
  );
}

export default function App() {
  const { showSplash, isFadingOut, isAppVisible } = useSplashScreen();

  // Re-check the saved session once (the user may have been blocked or removed)
  useEffect(() => {
    void useAuthStore.getState().refresh();
  }, []);

  // Back from Paymob: the query is only a hint; the webhook marks the order paid
  useEffect(() => {
    const result = readPaymentReturn(window.location.search);
    if (!result) return;
    useUIStore
      .getState()
      .showToast(
        result === 'success'
          ? '✅ الدفع اتبعت، وهنأكد طلبك أول ما Paymob يبلغنا'
          : '⚠️ الدفع ماكملش. طلبك متسجل، وتقدر تدفع كاش عند الاستلام'
      );
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const setActiveTab = useGoToTab();
  const toastMessage = useUIStore((state) => state.toastMessage);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const searchMounted = useUIStore((state) => state.searchMounted);

  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [modalData, setModalData] = useState<OrderModalData | null>(null);
  // Bumped on every open so OrderModal remounts with clean state (step, promo, notes)
  const [orderModalKey, setOrderModalKey] = useState(0);

  // Order Success Screen State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState('');


  const handleOpenOrderModal = (data: OrderModalData) => {
    // Like Talabat: a Google account gives its phone, village and address only now,
    // in a sheet over the page, and the order form opens right after
    if (!ensureProfileForOrder(() => handleOpenOrderModal(data))) return;
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
                <Route path={ROUTES.authCallback} element={<AuthCallbackPage />} />
                <Route path={ROUTES.completeProfile} element={<CompleteProfilePage />} />
                <Route path={ROUTES.about} element={<AboutPage />} />
                <Route path={ROUTES.groups} element={<GroupsPage />} />
                <Route path={ROUTES.donate} element={<DonatePage />} />
                <Route path={ROUTES.jobs} element={<JobsPage />} />
                <Route path={ROUTES.jobsNew} element={<JobFormPage />} />
                <Route path={ROUTES.jobsMine} element={<MyJobsPage />} />
                <Route path={ROUTES.jobsReview} element={<JobsReviewPage />} />
                <Route path={`${ROUTES.jobs}/:id`} element={<JobDetailPage />} />
                <Route path={`${ROUTES.jobs}/:id/edit`} element={<JobFormPage />} />
                <Route path={ROUTES.marketSale} element={<MarketListPage key="sale" kind="sale" />} />
                <Route path={ROUTES.marketSwap} element={<MarketListPage key="swap" kind="swap" />} />
                <Route path={ROUTES.marketNew} element={<MarketFormPage />} />
                <Route path={ROUTES.marketMine} element={<MarketMinePage />} />
                <Route path={ROUTES.marketReview} element={<MarketReviewPage />} />
                <Route path="/market/item/:id" element={<MarketItemPage />} />
                <Route path="/market/item/:id/edit" element={<MarketFormPage />} />
                <Route path="/market/chat/:listingId/:buyerId" element={<MarketChatPage />} />
                <Route path={ROUTES.rides} element={<RidesPage />} />
                <Route path={ROUTES.ridesNew} element={<RideFormPage key="new" />} />
                <Route path={ROUTES.ridesMine} element={<MyRidesPage />} />
                <Route path={ROUTES.ridesReview} element={<RidesReviewPage />} />
                <Route path={ROUTES.admin} element={<AdminPage />} />
                <Route path={ROUTES.dashboard} element={<ProviderDashboardPage />} />
                <Route path={`${ROUTES.rides}/:id`} element={<RideDetailPage />} />
                <Route path={`${ROUTES.rides}/:id/edit`} element={<RideFormPage key="edit" />} />
                {/* Unknown URLs go home instead of a blank page */}
                <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
              </Routes>
            </Suspense>
          </PageWrapper>
        </main>

        {/* Desktop-only footer with the developer's name */}
        <Footer />

        {/* Mobile Bottom Navigation */}
        <BottomNav onOpenQuickOrder={handleOpenOrderModal} />

        {/* Full search screen (from the header's search bar); its code loads on first use */}
        {searchMounted && (
          <Suspense fallback={isSearchOpen ? <SearchLoadingFallback /> : null}>
            <SearchScreen onOpenOrderModal={handleOpenOrderModal} />
          </Suspense>
        )}

        {/* Global Cart Drawer */}
        <CartDrawer />
        <ConfirmDialog />
        <CompleteProfileSheet />

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
