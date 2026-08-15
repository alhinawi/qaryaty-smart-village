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

// ─── Types
interface OrderModalProps {
  isOpen: boolean;
  data: OrderModalData | null;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

// ─── Component
export function OrderModal({
  isOpen,
  data,
  onClose,
  onSuccess,
}: OrderModalProps) {
  const profile = useUserStore((state) => state.profile);
  const addRewardPoints = useUserStore((state) => state.addRewardPoints);
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

  const basePrice = data.numericPrice || 25;
  const discountAmount = discountApplied ? basePrice : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

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
    if (discountCode.trim().toUpperCase() === 'QARYA1') {
      setDiscountApplied(true);
      showToast('🎉 كود QARYA1 مفعّل: خصم 100% على أول طلب!');
    } else {
      showToast('❌ كود الخصم غير صحيح. جرب كود QARYA1');
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderNum = generateOrderNumber();
    placeOrder({
      orderNumber: orderNum,
      serviceName: data.name,
      serviceEmoji: data.emoji,
      address,
      phone,
      notes,
      paymentMethod,
      discountCode: discountApplied ? 'QARYA1' : undefined,
      discountAmount,
      totalAmount: finalPrice,
      status: 'pending',
    });

    // Add reward points (+10 points per order)
    addRewardPoints(10);

    // Reset local modal state
    setStep(1);
    setNotes('');
    setDiscountCode('');
    setDiscountApplied(false);

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
      <div className="order-modal-body">
        <p className="order-modal-desc">
          {data.desc || 'املي البيانات وهنبعتلك حد في أسرع وقت داخل القرية'}
        </p>

        {/* Step Progress Bar */}
        <div className="order-step-progress-bar" aria-label={`الخطوة ${step} من 2`}>
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-text">العنوان والبيانات</span>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-text">الدفع والخصم</span>
          </div>
        </div>

        {/* STEP 1: Address & Contact */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="order-step-form">
            <div className="form-group">
              <label htmlFor="modalAddress">📍 عنوانك داخل القرية *</label>
              <input
                id="modalAddress"
                type="text"
                placeholder="مثال: شارع الجامع الكبير، أمام المدرسة"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={errors.address ? 'is-invalid' : ''}
              />
              {errors.address && (
                <span className="input-error-msg">{errors.address}</span>
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
              />
              {errors.phone && (
                <span className="input-error-msg">{errors.phone}</span>
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
          <form onSubmit={handleFinalSubmit} className="order-step-form">
            {/* Promo Code Box */}
            <div className="form-group">
              <label>🎟️ كود الخصم (جرب كود QARYA1)</label>
              <div className="promo-input-row">
                <input
                  type="text"
                  placeholder="أدخل كود الخصم..."
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={discountApplied}
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
            <div className="order-summary-box">
              <div className="summary-row">
                <span>سعر الخدمة:</span>
                <span>{data.price || formatCurrency(basePrice)}</span>
              </div>
              {discountApplied && (
                <div className="summary-row discount-row">
                  <span>خصم كود QARYA1:</span>
                  <span>-{formatCurrency(discountAmount)} (100% مجاناً)</span>
                </div>
              )}
              <div className="summary-row total-row">
                <strong>الإجمالي النهائي:</strong>
                <strong>{formatCurrency(finalPrice)}</strong>
              </div>
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
