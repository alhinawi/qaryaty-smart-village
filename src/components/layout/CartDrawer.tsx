// ─── Imports
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { formatCurrency, generateOrderNumber } from '@/utils/helpers';

// ─── Component
export function CartDrawer() {
  const isOpen = useUIStore((state) => state.isCartOpen);
  const setIsOpen = useUIStore((state) => state.setIsCartOpen);
  const showToast = useUIStore((state) => state.showToast);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalAmount = useCartStore((state) => state.getTotalAmount());

  const placeOrder = useOrderStore((state) => state.placeOrder);

  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [address, setAddress] = useState('شارع المدرسة، قرية البركة');
  const [phone, setPhone] = useState('01012345678');

  if (!isOpen) return null;

  const discountAmount = discountApplied ? totalAmount : 0;
  const finalTotal = Math.max(0, totalAmount - discountAmount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'QARYA1') {
      setDiscountApplied(true);
      showToast('🎉 تم تطبيق كود QARYA1: خصم 100% على الطلب!');
    } else {
      showToast('❌ كود الخصم غير صحيح. جرب كود QARYA1');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;

    const names = items.map((i) => `${i.name} (${i.quantity})`).join(' + ');
    const emojis = items.map((i) => i.emoji).slice(0, 3).join(' ');

    const newOrder = placeOrder({
      orderNumber: generateOrderNumber(),
      serviceName: `سلة مشتريات: ${names}`,
      serviceEmoji: emojis || '🛒',
      address,
      phone,
      paymentMethod: 'cash',
      discountCode: discountApplied ? 'QARYA1' : undefined,
      discountAmount,
      totalAmount: finalTotal,
      status: 'pending',
    });

    clearCart();
    setIsOpen(false);
    showToast(`✅ تم تأكيد طلبك برقم ${newOrder.orderNumber}!`);
    setActiveTab('orders');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      emoji="🛒"
      title="سلة المشتريات"
      maxWidth="600px"
    >
      {items.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="سلتك فاضية!"
          description="لم تقم بإضافة أي خدمات أو مشتريات إلى سلتك بعد."
          actionText="تصفح الخدمات"
          onAction={() => {
            setIsOpen(false);
            setActiveTab('home');
          }}
        />
      ) : (
        <div className="cart-drawer-content">
          {/* Items List */}
          <div className="cart-items-list">
            {items.map((item) => (
              <div key={item.id} className="cart-item-row">
                <div className="cart-item-icon">{item.emoji}</div>
                <div className="cart-item-info">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <div className="cart-item-price">
                    {formatCurrency(item.price)} × {item.quantity} ={' '}
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="cart-qty-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="تقليل الكمية"
                  >
                    -
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  className="cart-delete-btn"
                  onClick={() => removeItem(item.id)}
                  aria-label={`حذف ${item.name}`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Promo Code Box */}
          <form onSubmit={handleApplyPromo} className="promo-input-box">
            <input
              type="text"
              placeholder="هل لديك كود خصم؟ (جرب QARYA1)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={discountApplied}
            />
            <Button
              type="submit"
              variant={discountApplied ? 'success' : 'gold'}
              size="sm"
              disabled={discountApplied}
            >
              {discountApplied ? 'مفعّل ✓' : 'تطبيق'}
            </Button>
          </form>

          {/* Quick Delivery Details */}
          <div className="cart-delivery-details">
            <div className="form-group mb-2">
              <label>📍 عنوان التوصيل:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="form-group mb-2">
              <label>📱 رقم الموبايل للتواصل:</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary-box">
            <div className="summary-row">
              <span>المجموع الفرعي:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            {discountApplied && (
              <div className="summary-row discount-row">
                <span>خصم كود QARYA1:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="summary-row total-row">
              <strong>الإجمالي المطلوب:</strong>
              <strong>{formatCurrency(finalTotal)}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cart-actions-row">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleCheckout}
            >
              🚀 تأكيد وإتمام الطلب ({formatCurrency(finalTotal)})
            </Button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsOpen(false)}
            >
              متابعة التسوق
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
