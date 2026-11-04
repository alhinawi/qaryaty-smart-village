// ─── Imports
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { useGoToTab } from '@/hooks/useTabNavigation';
import { useOrderStore } from "@/stores/useOrderStore";
import { useUserStore } from "@/stores/useUserStore";
import { orderFormSchema } from "@/utils/validators";
import { formatCurrency, generateOrderNumber } from "@/utils/helpers";
import {
  FIRST_ORDER_PROMO,
  checkPromoCode,
  describeTotal,
  getCartItemPriceType,
  getCartPricing,
} from "@/utils/pricing";
import type { CartItem, PaymentMethod } from "@/types";

// ─── Component
// The content only mounts while the drawer is open, so the promo code,
// discount and form fields start fresh each time (and after checkout).
export function CartDrawer() {
  const isOpen = useUIStore((state) => state.isCartOpen);
  if (!isOpen) return null;
  return <CartDrawerContent />;
}

function formatLinePrice(item: CartItem): string {
  const type = getCartItemPriceType(item);
  if (type === "quote") return "السعر بعد التأكيد";
  const line = `${formatCurrency(item.price)} × ${item.quantity} = ${formatCurrency(
    item.price * item.quantity,
  )}`;
  return type === "from" ? `من ${line}` : line;
}

function CartDrawerContent() {
  const setIsOpen = useUIStore((state) => state.setIsCartOpen);
  const showToast = useUIStore((state) => state.showToast);
  const setActiveTab = useGoToTab();

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const orders = useOrderStore((state) => state.orders);
  const placeOrder = useOrderStore((state) => state.placeOrder);

  const profile = useUserStore((state) => state.profile);
  const usedPromoCodes = useUserStore((state) => state.usedPromoCodes);
  const markPromoUsed = useUserStore((state) => state.markPromoUsed);
  const addRewardPoints = useUserStore((state) => state.addRewardPoints);

  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [address, setAddress] = useState(profile.address || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const close = () => setIsOpen(false);

  const pricing = getCartPricing(items, discountApplied);
  const totalLabel = describeTotal(
    pricing.subtotal === 0 && pricing.hasQuoteItems ? null : pricing.total,
    pricing.isEstimate,
    formatCurrency,
  );

  const promoContext = {
    orders,
    usedPromoCodes,
    discountableAmount: pricing.discountableAmount,
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const result = checkPromoCode(promoCode, promoContext);
    if (result.ok) {
      setDiscountApplied(true);
      showToast(`🎉 تم تطبيق كود ${FIRST_ORDER_PROMO}: خصم 100% على أول طلب!`);
    } else {
      showToast(result.message);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setErrors({});

    // Same rules as the single-service order form (PRD section 12)
    const validation = orderFormSchema.safeParse({
      address,
      phone,
      notes: "",
      paymentMethod,
      discountCode: promoCode,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      showToast("⚠️ من فضلك تأكد من صحة بيانات العنوان والموبايل");
      return;
    }

    // Re-check the promo in case it was used elsewhere meanwhile
    const promoStillValid =
      discountApplied && checkPromoCode(promoCode, promoContext).ok;
    const finalPricing = getCartPricing(items, promoStillValid);
    const total =
      finalPricing.subtotal === 0 && finalPricing.hasQuoteItems
        ? null
        : finalPricing.total;

    const names = items.map((i) => `${i.name} (${i.quantity})`).join(" + ");
    const emojis = items
      .map((i) => i.emoji)
      .slice(0, 3)
      .join(" ");

    const newOrder = placeOrder({
      orderNumber: generateOrderNumber(),
      serviceName: `سلة مشتريات: ${names}`,
      serviceEmoji: emojis || "🛒",
      address: validation.data.address,
      phone: validation.data.phone,
      paymentMethod: validation.data.paymentMethod,
      discountCode: promoStillValid ? FIRST_ORDER_PROMO : undefined,
      discountAmount: finalPricing.discountAmount,
      totalAmount: total,
      isEstimate: finalPricing.isEstimate,
      status: "pending",
    });

    if (promoStillValid) {
      markPromoUsed(FIRST_ORDER_PROMO);
    }
    // Same rule as the order modal: +10 points, except for a free order
    if (total !== 0) {
      addRewardPoints(10);
    }

    clearCart();
    close();
    showToast(`✅ تم تأكيد طلبك برقم ${newOrder.orderNumber}!`);
    setActiveTab("orders");
  };

  return (
    <Modal
      isOpen
      onClose={close}
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
            close();
            setActiveTab("home");
          }}
        />
      ) : (
        <div className="cart-drawer-content">
          {/* Items List */}
          <div className="flex flex-col gap-3 mb-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl"
              >
                <div className="text-[28px]">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold">{item.name}</h4>
                  <div className="text-xs text-text-muted">
                    {formatLinePrice(item)}
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
                  <span className="text-sm font-extrabold min-w-[20px] text-center">
                    {item.quantity}
                  </span>
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
          <form onSubmit={handleApplyPromo} className="form-group mb-4">
            <label htmlFor="cartPromo">
              🎟️ كود الخصم (كود {FIRST_ORDER_PROMO} لأول طلب)
            </label>
            <div className="flex gap-2">
              <input
                id="cartPromo"
                type="text"
                placeholder="أدخل كود الخصم..."
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={discountApplied}
                className="flex-1"
              />
              <Button
                type="submit"
                variant={discountApplied ? "success" : "gold"}
                size="sm"
                disabled={discountApplied}
              >
                {discountApplied ? "مفعّل ✓" : "تطبيق"}
              </Button>
            </div>
          </form>

          {/* Delivery Details (prefilled from the profile) */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="form-group">
              <label htmlFor="cartAddress">📍 عنوان التوصيل *</label>
              <input
                id="cartAddress"
                type="text"
                placeholder="مثال: شارع الجامع الكبير، أمام المدرسة"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={errors.address ? "is-invalid" : ""}
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "cartAddressError" : undefined}
                autoComplete="street-address"
              />
              {errors.address && (
                <span id="cartAddressError" className="input-error-msg">
                  {errors.address}
                </span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="cartPhone">📱 رقم الموبايل للتواصل *</label>
              <input
                id="cartPhone"
                type="tel"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={errors.phone ? "is-invalid" : ""}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "cartPhoneError" : undefined}
                inputMode="tel"
                autoComplete="tel"
              />
              {errors.phone && (
                <span id="cartPhoneError" className="input-error-msg">
                  {errors.phone}
                </span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="cartPayment">💳 طريقة الدفع</label>
              <select
                id="cartPayment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">كاش عند الاستلام 💵</option>
                <option value="vodafone">فودافون كاش 📱</option>
                <option value="instapay">انستاباي ⚡</option>
              </select>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-xl p-3.5 mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span>المجموع الفرعي:</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
            {discountApplied && pricing.discountAmount > 0 && (
              <div className="flex justify-between text-sm mb-1.5 text-success font-bold">
                <span>خصم كود {FIRST_ORDER_PROMO}:</span>
                <span>-{formatCurrency(pricing.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base border-t border-gray-200 pt-2 mt-2">
              <strong>{pricing.isEstimate ? "الإجمالي المبدئي:" : "الإجمالي المطلوب:"}</strong>
              <strong>{totalLabel}</strong>
            </div>
            {pricing.isEstimate && (
              <p className="text-xs text-text-muted mt-1">
                في حاجات في السلة سعرها بيبدأ من رقم معين أو بيتحدد بعد التأكيد، فالإجمالي
                النهائي بيتأكد مع مقدم الخدمة.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleCheckout}
            >
              🚀 تأكيد وإتمام الطلب ({totalLabel})
            </Button>
            <button type="button" className="btn-cancel" onClick={close}>
              متابعة التسوق
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
