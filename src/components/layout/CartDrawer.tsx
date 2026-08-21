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
          <div className="flex flex-col gap-3 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                <div className="text-[28px]">{item.emoji}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-extrabold">{item.name}</h4>
                  <div className="text-xs text-text-muted">
                    {formatCurrency(item.price)} × {item.quantity} ={' '}
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="w-[26px] h-[26px] rounded-md bg-white border border-gray-300 flex items-center justify-center font-extrabold cursor-pointer"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="تقليل الكمية"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold min-w-[20px] text-center">{item.quantity}</span>
                  <button
                    type="button"
                    className="w-[26px] h-[26px] rounded-md bg-white border border-gray-300 flex items-center justify-center font-extrabold cursor-pointer"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  className="bg-transparent border-none text-[16px] cursor-pointer p-1"
                  onClick={() => removeItem(item.id)}
                  aria-label={`حذف ${item.name}`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Promo Code Box */}
          <form onSubmit={handleApplyPromo} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="هل لديك كود خصم؟ (جرب QARYA1)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={discountApplied}
              className="flex-1 py-2 px-3 rounded-lg border-2 border-green/15 font-['Cairo',sans-serif] text-[13px]"
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
          <div className="bg-gray-50 rounded-xl p-3.5 mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span>المجموع الفرعي:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            {discountApplied && (
              <div className="flex justify-between text-sm mb-1.5 text-success font-bold">
                <span>خصم كود QARYA1:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-1.5 text-base border-t border-gray-200 pt-2 mt-2">
              <strong>الإجمالي المطلوب:</strong>
              <strong>{formatCurrency(finalTotal)}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-4">
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
