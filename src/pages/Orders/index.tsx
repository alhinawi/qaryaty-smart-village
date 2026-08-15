// ─── Imports
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/helpers';
import type { Order, OrderStatus } from '@/types';

// ─── Component
export default function OrdersPage() {
  const orders = useOrderStore((state) => state.orders);
  const updateStatus = useOrderStore((state) => state.updateStatus);
  const deleteOrder = useOrderStore((state) => state.deleteOrder);

  const openRatingModal = useUIStore((state) => state.openRatingModal);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const showToast = useUIStore((state) => state.showToast);

  const handleSimulateNextStep = (order: Order) => {
    const nextStatus: Record<OrderStatus, OrderStatus> = {
      pending: 'confirmed',
      confirmed: 'onway',
      onway: 'done',
      done: 'done',
    };

    const next = nextStatus[order.status];
    updateStatus(order.id, next);

    if (next === 'confirmed') {
      showToast(`🔍 تم قبول طلبك ${order.orderNumber} وجاري تجهيزه!`);
    } else if (next === 'onway') {
      showToast(`🛵 الكابتن استلم طلبك ${order.orderNumber} وهو في الطريق!`);
    } else if (next === 'done') {
      showToast(`🎉 تم تسليم طلبك ${order.orderNumber} بنجاح!`);
    }
  };

  const handleDelete = (orderId: string, orderNum: string) => {
    deleteOrder(orderId);
    showToast(`🗑️ تم حذف الطلب ${orderNum}`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">⏳ قيد المراجعة</Badge>;
      case 'confirmed':
        return <Badge variant="info">🔍 جاري التجهيز</Badge>;
      case 'onway':
        return <Badge variant="popular">🛵 في الطريق إليك</Badge>;
      case 'done':
        return <Badge variant="success">✓ تم التسليم</Badge>;
    }
  };

  return (
    <div className="orders-page-container">
      {/* Page Header */}
      <div className="page-header-title">
        <h2>📋 سجل طلباتي ({orders.length})</h2>
        <p>تابع حالة طلباتك الحالية وسجل الطلبات السابقة داخل القرية</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="مفيش طلبات سابقة!"
          description="لم تقم بإجراء أي طلبات حتى الآن. اختر من مئات خدمات ومحلات القرية."
          actionText="ابدأ الطلب الآن"
          onAction={() => setActiveTab('home')}
        />
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-history-card">
              {/* Card Top */}
              <div className="order-card-header">
                <div className="order-header-main">
                  <span className="order-card-emoji">{order.serviceEmoji}</span>
                  <div>
                    <h3 className="order-service-name">{order.serviceName}</h3>
                    <span className="order-meta-info">
                      رقم الطلب: <strong>{order.orderNumber}</strong> • {order.createdAt}
                    </span>
                  </div>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Order Details */}
              <div className="order-card-details">
                <div className="detail-item">
                  <span className="detail-label">📍 العنوان:</span>
                  <span className="detail-val">{order.address}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📱 الموبايل:</span>
                  <span className="detail-val">{order.phone}</span>
                </div>
                {order.notes && (
                  <div className="detail-item">
                    <span className="detail-label">📝 ملاحظات:</span>
                    <span className="detail-val">{order.notes}</span>
                  </div>
                )}
                <div className="detail-item total-item">
                  <span className="detail-label">💰 المبلغ:</span>
                  <span className="detail-val price-val">
                    {formatCurrency(order.totalAmount)}
                    {order.discountAmount > 0 && (
                      <span className="discount-tag"> (خصم {order.discountAmount} ج)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* 4-Step Tracking Timeline */}
              <div className="order-timeline-box">
                <div className={`timeline-step ${order.status !== 'pending' ? 'done' : 'active'}`}>
                  <div className="step-dot">1</div>
                  <span>استلام الطلب</span>
                </div>
                <div
                  className={`timeline-step ${
                    order.status === 'confirmed'
                      ? 'active'
                      : order.status === 'onway' || order.status === 'done'
                      ? 'done'
                      : ''
                  }`}
                >
                  <div className="step-dot">2</div>
                  <span>تجهيز المزود</span>
                </div>
                <div
                  className={`timeline-step ${
                    order.status === 'onway'
                      ? 'active'
                      : order.status === 'done'
                      ? 'done'
                      : ''
                  }`}
                >
                  <div className="step-dot">3</div>
                  <span>في الطريق</span>
                </div>
                <div className={`timeline-step ${order.status === 'done' ? 'done' : ''}`}>
                  <div className="step-dot">4</div>
                  <span>التسليم</span>
                </div>
              </div>

              {/* Rating Section if Delivered */}
              {order.status === 'done' && (
                <div className="order-rating-preview">
                  {order.rating ? (
                    <div className="existing-rating">
                      <span>تقييمك:</span>
                      <span className="stars">{'⭐'.repeat(order.rating)}</span>
                      {order.feedback && <p className="feedback">"{order.feedback}"</p>}
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
              <div className="order-card-actions">
                {order.status !== 'done' && (
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
                  className="order-delete-btn"
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
