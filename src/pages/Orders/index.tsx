// ─── Imports
import { useOrderStore } from "@/stores/useOrderStore";
import { useUIStore } from "@/stores/useUIStore";
import { useGoToTab } from '@/hooks/useTabNavigation';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/utils/helpers";
import { describeTotal } from "@/utils/pricing";
import type { Order, OrderStatus } from "@/types";

// ─── Component
export default function OrdersPage() {
  const orders = useOrderStore((state) => state.orders);
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
    };

    const next = nextStatus[order.status];
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
      case "pending":
        return <Badge variant="warning">⏳ قيد المراجعة</Badge>;
      case "confirmed":
        return <Badge variant="info">🔍 جاري التجهيز</Badge>;
      case "onway":
        return <Badge variant="popular">🛵 في الطريق إليك</Badge>;
      case "done":
        return <Badge variant="success">✓ تم التسليم</Badge>;
    }
  };

  return (
    <div className="orders-page-container">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-[clamp(1.375rem,3vw,1.75rem)] font-black text-green-dark font-['Tajawal',sans-serif] mb-1">
          📋 سجل طلباتي ({orders.length})
        </h2>
        <p className="text-sm text-text-muted">
          تابع حالة طلباتك الحالية وسجل الطلبات السابقة داخل القرية
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="مفيش طلبات سابقة!"
          description="لم تقم بإجراء أي طلبات حتى الآن. اختر من مئات خدمات ومحلات القرية."
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
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Order Details */}
              <div className="mb-3.5 text-[13px]">
                <div className="flex gap-2 mb-1">
                  <span className="text-text-muted font-bold">📍 العنوان:</span>
                  <span className="detail-val">{order.address}</span>
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
                    {order.discountAmount > 0 && (
                      <span className="text-success font-bold">
                        {" "}
                        (خصم {order.discountAmount} ج)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* 4-Step Tracking Timeline */}
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

              {/* Rating Section if Delivered */}
              {order.status === "done" && (
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
                {order.status !== "done" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSimulateNextStep(order)}
                  >
                    ⚡ محاكاة الخطوة التالية
                  </Button>
                )}

                <button
                  type="button"
                  className="bg-transparent border-none text-text-muted text-[13px] cursor-pointer font-['Cairo',sans-serif] font-bold hover:text-danger"
                  onClick={() => handleDelete(order.id, order.orderNumber)}
                  aria-label="حذف من السجل"
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
