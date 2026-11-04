// ─── Imports
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { OrderModalData, PaymentMethod } from '@/types';
import { orderFormSchema } from '@/utils/validators';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUserStore } from '@/stores/useUserStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatCurrency, generateOrderNumber } from '@/utils/helpers';
import {
  FIRST_ORDER_PROMO,
  checkPromoCode,
  describeTotal,
  getOrderPricing,
} from '@/utils/pricing';

// ─── Types
interface OrderModalProps {
  isOpen: boolean;
  data: OrderModalData | null;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

// ─── Component
// App mounts this with a fresh `key` every time it opens, so all local state
// (step, promo, notes) starts clean for each order.
export function OrderModal({
  isOpen,
  data,
  onClose,
  onSuccess,
}: OrderModalProps) {
  const profile = useUserStore((state) => state.profile);
  const addRewardPoints = useUserStore((state) => state.addRewardPoints);
  const usedPromoCodes = useUserStore((state) => state.usedPromoCodes);
  const markPromoUsed = useUserStore((state) => state.markPromoUsed);
  const orders = useOrderStore((state) => state.orders);
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const showToast = useUIStore((state) => state.showToast);

  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState(profile.address || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !data) return null;

  const pricing = getOrderPricing(data, discountApplied);
  const { basePrice, discountAmount, finalPrice, isEstimate } = pricing;
  const servicePriceLabel =
    data.price ||
    (basePrice == null ? 'حسب الطلب' : formatCurrency(basePrice));

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate Step 1 with Zod
    const validation = orderFormSchema.safeParse({
      address,
      phone,
      notes,
      paymentMethod,
      discountCode,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      showToast('⚠️ من فضلك تأكد من صحة بيانات العنوان والموبايل');
      return;
    }

    setStep(2);
  };

  const handleApplyPromo = () => {
    const result = checkPromoCode(discountCode, {
      orders,
      usedPromoCodes,
      discountableAmount: pricing.discountableAmount,
    });
    if (result.ok) {
      setDiscountApplied(true);
      showToast(`🎉 كود ${FIRST_ORDER_PROMO} مفعّل: خصم 100% على أول طلب!`);
    } else {
      showToast(result.message);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Re-check at submit time in case another order was placed meanwhile
    const promoStillValid =
      discountApplied &&
      checkPromoCode(discountCode, {
        orders,
        usedPromoCodes,
        discountableAmount: pricing.discountableAmount,
      }).ok;
    const appliedDiscount = promoStillValid ? discountAmount : 0;
    const total =
      finalPrice == null ? null : Math.max(0, (basePrice ?? 0) - appliedDiscount);

    const orderNum = generateOrderNumber();
    placeOrder({
      orderNumber: orderNum,
      serviceName: data.name,
      serviceEmoji: data.emoji,
      address,
      phone,
      notes,
      paymentMethod,
      discountCode: promoStillValid ? FIRST_ORDER_PROMO : undefined,
      discountAmount: appliedDiscount,
      totalAmount: total,
      isEstimate,
      status: 'pending',
    });

    if (promoStillValid) {
      markPromoUsed(FIRST_ORDER_PROMO);
    }

    // +10 reward points per order, but not for an order that ends up free
    if (total !== 0) {
      addRewardPoints(10);
    }

    onClose();
    onSuccess(orderNum);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      emoji={data.emoji || '🛵'}
      title={data.name || 'اطلب خدمة'}
      maxWidth="540px"
    >
      <div className="p-0">
        <p className="text-sm text-text-muted text-center mb-5 leading-relaxed">
          {data.desc || 'املي البيانات وهنبعتلك حد في أسرع وقت داخل القرية'}
        </p>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-5" aria-label={`الخطوة ${step} من 2`}>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? 'text-green' : 'text-text-muted'}`}>
            <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-green text-white' : 'bg-gray-200 text-black'}`}>1</span>
            <span className="step-text">العنوان والبيانات</span>
          </div>
          <div className="w-[30px] h-0.5 bg-gray-200" />
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? 'text-green' : 'text-text-muted'}`}>
            <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-green text-white' : 'bg-gray-200 text-black'}`}>2</span>
            <span className="step-text">الدفع والخصم</span>
          </div>
        </div>

        {/* STEP 1: Address & Contact */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="flex flex-col gap-4">
            <div className="form-group">
              <label htmlFor="modalAddress">📍 عنوانك داخل القرية *</label>
              <input
                id="modalAddress"
                type="text"
                placeholder="مثال: شارع الجامع الكبير، أمام المدرسة"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={errors.address ? 'is-invalid' : ''}
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? 'modalAddressError' : undefined}
                autoComplete="street-address"
              />
              {errors.address && (
                <span id="modalAddressError" className="input-error-msg">{errors.address}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="modalPhone">📱 رقم موبايلك للتواصل *</label>
              <input
                id="modalPhone"
                type="tel"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={errors.phone ? 'is-invalid' : ''}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'modalPhoneError' : undefined}
                inputMode="tel"
                autoComplete="tel"
              />
              {errors.phone && (
                <span id="modalPhoneError" className="input-error-msg">{errors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="modalNotes">📝 ملاحظات إضافية (اختياري)</label>
              <textarea
                id="modalNotes"
                placeholder="اكتب أي تفاصيل إضافية هنا لتسهيل الوصول..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              التالي: الدفع والخصم ⬅️
            </Button>

            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              إلغاء
            </button>
          </form>
        )}

        {/* STEP 2: Payment & Promo */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="flex flex-col gap-4">
            {/* Promo Code Box */}
            <div className="form-group">
              <label htmlFor="modalPromo">
                🎟️ كود الخصم (كود {FIRST_ORDER_PROMO} لأول طلب)
              </label>
              <div className="flex gap-2">
                <input
                  id="modalPromo"
                  type="text"
                  placeholder="أدخل كود الخصم..."
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={discountApplied}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant={discountApplied ? 'success' : 'gold'}
                  size="sm"
                  onClick={handleApplyPromo}
                  disabled={discountApplied}
                >
                  {discountApplied ? 'مفعّل ✓' : 'تطبيق'}
                </Button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="form-group">
              <label htmlFor="modalPayment">💳 طريقة الدفع</label>
              <select
                id="modalPayment"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
              >
                <option value="cash">كاش عند الاستلام 💵</option>
                <option value="vodafone">فودافون كاش 📱</option>
                <option value="instapay">انستاباي ⚡</option>
              </select>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-xl p-3.5 mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span>سعر الخدمة:</span>
                <span>{servicePriceLabel}</span>
              </div>
              {discountApplied && discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-1.5 text-success font-bold">
                  <span>خصم كود {FIRST_ORDER_PROMO}:</span>
                  <span>-{formatCurrency(discountAmount)} (100% مجاناً)</span>
                </div>
              )}
              <div className="flex justify-between mb-1.5 text-base border-t border-gray-200 pt-2 mt-2">
                <strong>
                  {finalPrice == null
                    ? 'الإجمالي:'
                    : isEstimate
                      ? 'الإجمالي المبدئي:'
                      : 'الإجمالي النهائي:'}
                </strong>
                <strong>{describeTotal(finalPrice, isEstimate, formatCurrency)}</strong>
              </div>
              {finalPrice == null && (
                <p className="text-xs text-text-muted mt-1">
                  مقدم الخدمة هيكلمك يأكد السعر قبل التنفيذ.
                </p>
              )}
              {isEstimate && (
                <p className="text-xs text-text-muted mt-1">
                  ده أقل سعر للخدمة، والسعر النهائي بيتأكد مع مقدم الخدمة.
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              🚀 تأكيد وإرسال الطلب الآن
            </Button>

            <button
              type="button"
              className="btn-cancel"
              onClick={() => setStep(1)}
            >
              ⬅️ العودة لتعديل البيانات
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
