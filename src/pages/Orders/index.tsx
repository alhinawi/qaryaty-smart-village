import {stockKey,useDemoStock} from '@/components/merchant/demoStock';
import {isTrackingDemoMode} from '@/config/demoMode';
import { useEventSimulationStore } from '@/pages/EventsPreview/simulation';
import { useAuthStore } from '@/stores/useAuthStore';
import { EventBookings } from '@/pages/EventsPreview/EventBookings';
import { DemoOrderHistory, DEMO_HISTORY_COUNT } from '@/components/orders/DemoOrderHistory';
import { OwnReviewsProvider } from '@/components/reviews/OwnReviewsProvider';
import { OrderReviewAction } from '@/components/reviews/OrderReviewAction';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { visibleCustomerOrders } from '@/utils/visibleCustomerOrders';
import { useEffect } from 'react';
import { isSupabaseConfigured } from '@/repositories';
// ─── Imports
import { useOrderStore } from "@/stores/useOrderStore";
import { DELIVERY_FEE_LABEL } from "@/config/delivery";
import { useUIStore } from "@/stores/useUIStore";
import { useGoToTab } from '@/hooks/useTabNavigation';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/utils/helpers";
import { FIRST_ORDER_PROMO, FIRST_ORDER_PROMO_TEXT, describeTotal } from "@/utils/pricing";
import { googleMapsUrl } from "@/utils/address";
import type { Order, OrderStatus } from "@/types";

// ─── Component
export default function OrdersPage() {
  const ownerId = useOrderStore(state => state.ownerId);
  const historyLoading = useOrderStore(state => state.historyLoading);
  const historyError = useOrderStore(state => state.historyError);
  const historyLoaded = useOrderStore(state => state.historyLoaded);
  const historyHasMore = useOrderStore(state => state.historyHasMore);
  const loadHistory = useOrderStore(state => state.loadHistory);
  useEffect(() => {
    void loadHistory();
    const refresh = () => { void loadHistory(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [ownerId, loadHistory]);
  const trackingDemo = useTrackingDemoMode();
  const eventScope=useAuthStore(s=>s.session?.user.id??'guest');
  const eventBookings=useEventSimulationStore(s=>s.bookings);
  const eventCount=trackingDemo?eventBookings.filter(b=>b.scope===eventScope).length:0;
  const storedOrders = useOrderStore((state) => state.orders);
  const realOrders = visibleCustomerOrders(storedOrders, trackingDemo).filter(order=>order.id!=='ord_demo_1'&&order.id!=='ord_demo_2');
  const orders = realOrders;
  const updateStatus = useOrderStore((state) => state.updateStatus);
  const deleteOrder = useOrderStore((state) => state.deleteOrder);

  const openRatingModal = useUIStore((state) => state.openRatingModal);
  const setActiveTab = useGoToTab();
  const showToast = useUIStore((state) => state.showToast);

  const handleSimulateNextStep = (order: Order) => {
    const nextStatus: Record<OrderStatus, OrderStatus> = {
      pending: "confirmed",
      confirmed: "onway",
      onway: "done",
      done: "done",
      cancelled: "cancelled",
    };

    if(!isTrackingDemoMode())return;
    const next = nextStatus[order.status];
    if(order.id.startsWith('ord_demo_local_')&&order.shopId!=null&&order.items?.length&&next==='done'){
      const eventId=JSON.stringify([eventScope,'cart-order',order.id]);
      if(!useDemoStock.getState().advanceOrder(eventId,order.items.map(line=>({key:stockKey(eventScope,order.shopId!,line.productId),quantity:line.quantity})),'اتسلّم')){
        showToast('الكمية مش كفاية في المخزون، راجع المتاح الأول');return;
      }
    }
    updateStatus(order.id, next);

    if (next === "confirmed") {
      showToast(`🔍 تم قبول طلبك ${order.orderNumber} وجاري تجهيزه!`);
    } else if (next === "onway") {
      showToast(`🛵 الكابتن استلم طلبك ${order.orderNumber} وهو في الطريق!`);
    } else if (next === "done") {
      showToast(`🎉 تم تسليم طلبك ${order.orderNumber} بنجاح!`);
    }
  };

  const handleDelete = (orderId: string, orderNum: string) => {
    deleteOrder(orderId);
    showToast(`🗑️ تم حذف الطلب ${orderNum}`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "cancelled":
        return <Badge variant="danger">الطلب اتلغى</Badge>;
      case "pending":
        return <Badge variant="warning">⏳ قيد المراجعة</Badge>;
      case "confirmed":
        return <Badge variant="info">🔍 بيتجهّز</Badge>;
      case "onway":
        return <Badge variant="popular">🛵 في الطريق إليك</Badge>;
      case "done":
        return <Badge variant="success">✓ اتسلّم</Badge>;
    }
  };

  return (
    <OwnReviewsProvider><div className="orders-page-container">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-[clamp(1.375rem,3vw,1.75rem)] font-black text-green-dark font-['Tajawal',sans-serif] mb-1">
          📋 سجل طلباتي ({realOrders.length + eventCount + (trackingDemo?DEMO_HISTORY_COUNT:0)})
        </h2>
        <p className="text-sm text-text-muted">
          تابع حالة طلباتك الحالية وسجل الطلبات السابقة داخل القرية
        </p>
      </div>

      <EventBookings />
      <DemoOrderHistory />
      {isSupabaseConfigured && ownerId && <div className="mb-4 text-left"><Button variant="outline" size="sm" loading={historyLoading} onClick={() => void loadHistory()}>تحديث الطلبات</Button></div>}
      {historyLoading && <p role="status" className="mb-4">بنحمّل طلباتك...</p>}
      {historyError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-danger">{historyError}</p>}
      {orders.length === 0 && eventCount === 0 && !trackingDemo && !historyLoading && !historyError && (!isSupabaseConfigured || !ownerId || historyLoaded) ? (
        <EmptyState
          emoji="📋"
          title="مفيش طلبات سابقة!"
          description="ابدأ طلبك من خدمات ومحلات القرية."
          actionText="ابدأ الطلب الآن"
          onAction={() => setActiveTab("home")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-green/10"
            >
              {/* Card Top */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-[32px]">{order.serviceEmoji}</span>
                  <div>
                    <h3 className="text-base font-extrabold">
                      {order.serviceName}
                    </h3>
                    <span className="block text-xs text-text-muted">
                      رقم الطلب: <strong>{order.orderNumber}</strong> •{" "}
                      {order.createdAt}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Order Details */}
              <div className="mb-3.5 text-[13px]">
                {order.options?.map((option) => (
                  <div key={option.label} className="flex gap-2 mb-1">
                    <span className="text-text-muted font-bold">✔️ {option.label}:</span>
                    <span className="detail-val">{option.value}</span>
                  </div>
                ))}
                <div className="flex gap-2 mb-1">
                  <span className="text-text-muted font-bold">📍 العنوان:</span>
                  <span className="detail-val">
                    {order.address}
                    {order.lat != null && order.lng != null && (
                      <a
                        href={googleMapsUrl({ lat: order.lat, lng: order.lng })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2 text-green font-bold whitespace-nowrap"
                      >
                        🗺️ افتح على الخريطة
                      </a>
                    )}
                  </span>
                </div>
                <div className="flex gap-2 mb-1">
                  <span className="text-text-muted font-bold">
                    📱 الموبايل:
                  </span>
                  <span className="detail-val">{order.phone}</span>
                </div>
                {order.notes && (
                  <div className="flex gap-2 mb-1">
                    <span className="text-text-muted font-bold">
                      📝 ملاحظات:
                    </span>
                    <span className="detail-val">{order.notes}</span>
                  </div>
                )}
                <div className="flex gap-2 mb-1">
                  <span className="text-text-muted font-bold">💰 المبلغ:</span>
                  <span className="font-extrabold text-green-dark">
                    {describeTotal(order.totalAmount, Boolean(order.isEstimate), formatCurrency)}
                    {order.discountCode === FIRST_ORDER_PROMO ? (
                      <span className="text-success font-bold">
                        {" "}
                        ({FIRST_ORDER_PROMO_TEXT}
                        {order.discountAmount > 0 && `، وفّرت ${formatCurrency(order.discountAmount)}`})
                      </span>
                    ) : (
                      order.discountAmount > 0 && (
                        <span className="text-success font-bold">
                          {" "}
                          (خصم {order.discountAmount} ج)
                        </span>
                      )
                    )}
                  </span>
                </div>
                {(order.deliveryFee ?? 0) > 0 && (
                  <div className="flex gap-2 mb-1">
                    <span className="text-text-muted font-bold">🛵 {DELIVERY_FEE_LABEL}:</span>
                    <span className="detail-val">
                      {formatCurrency(order.deliveryFee ?? 0)} (محسوبة في المبلغ)
                    </span>
                  </div>
                )}
              </div>

              {/* 4-Step Tracking Timeline */}
              {order.status !== "cancelled" && (
              <div className="grid grid-cols-4 gap-1 bg-gray-50 rounded-xl py-2.5 px-1 mb-3.5 text-center">
                <div
                  className={`flex flex-col items-center gap-1 text-[10px] font-bold ${order.status !== "pending" ? "text-text" : "text-text"}`}
                >
                  <div
                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-extrabold ${order.status !== "pending" ? "bg-green text-white" : "bg-gold text-black"}`}
                  >
                    1
                  </div>
                  <span>استلام الطلب</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                    order.status === "confirmed"
                      ? "text-text"
                      : order.status === "onway" || order.status === "done"
                        ? "text-text"
                        : "text-text-muted"
                  }`}
                >
                  <div
                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-extrabold ${order.status === "confirmed" ? "bg-gold text-black" : order.status === "onway" || order.status === "done" ? "bg-green text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    2
                  </div>
                  <span>تجهيز المزود</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                    order.status === "onway"
                      ? "text-text"
                      : order.status === "done"
                        ? "text-text"
                        : "text-text-muted"
                  }`}
                >
                  <div
                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-extrabold ${order.status === "onway" ? "bg-gold text-black" : order.status === "done" ? "bg-green text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    3
                  </div>
                  <span>في الطريق</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 text-[10px] font-bold ${order.status === "done" ? "text-text" : "text-text-muted"}`}
                >
                  <div
                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-extrabold ${order.status === "done" ? "bg-green text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    4
                  </div>
                  <span>التسليم</span>
                </div>
              </div>

              )}

              {/* Real reviews have server-side ownership/completion checks and no rewards. */}
              {isSupabaseConfigured && ownerId && order.status === 'done' && !order.id.startsWith('ord_demo_') && <OrderReviewAction key={`${ownerId}:${order.id}`} orderId={order.id} />}
              {/* Rating Section if Delivered */}
              {!isSupabaseConfigured && !order.id.startsWith("ord_demo_") && order.status === "done" && (
                <div className="mb-3">
                  {order.rating ? (
                    <div className="text-[13px] bg-amber-50 rounded-xl py-1.5 px-2.5">
                      <span>تقييمك:</span>
                      <span className="stars">{"⭐".repeat(order.rating)}</span>
                      {order.feedback && (
                        <p className="feedback">"{order.feedback}"</p>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => openRatingModal(order)}
                    >
                      ⭐ قيّم الخدمة واحصل على +20 نقطة
                    </Button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-3">
                {(!isSupabaseConfigured||trackingDemo&&order.id.startsWith("ord_demo_local_")) && order.status !== "done" && order.status !== "cancelled" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSimulateNextStep(order)}
                  >
                    الخطوة الجاية
                  </Button>
                )}

                {trackingDemo&&order.id.startsWith('ord_demo_local_')&&order.status!=='done'&&order.status!=='cancelled'&&<button className="text-danger text-xs font-bold py-2" onClick={()=>{
                  if(!isTrackingDemoMode())return;
                  const eventId=JSON.stringify([eventScope,'cart-order',order.id]);
                  if(useDemoStock.getState().advanceOrder(eventId,[],'الطلب اتلغى'))updateStatus(order.id,'cancelled');
                }}>إلغاء الطلب</button>}

                {!isSupabaseConfigured && <button
                  type="button"
                  className="bg-transparent border-none text-text-muted text-[13px] cursor-pointer font-['Cairo',sans-serif] font-bold hover:text-danger"
                  onClick={() => handleDelete(order.id, order.orderNumber)}
                  aria-label="حذف من السجل"
                >
                  🗑️ حذف
                </button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {historyHasMore && !historyError && <Button className="mt-4" loading={historyLoading} onClick={() => void loadHistory(true)}>عرض طلبات أقدم</Button>}
    </div></OwnReviewsProvider>
  );
}
