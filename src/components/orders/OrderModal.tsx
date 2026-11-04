// ─── Imports
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { OrderModalData, PaymentMethod } from '@/types';
import { orderFormSchema } from '@/utils/validators';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUserStore } from '@/stores/useUserStore';
import { useUIStore } from '@/stores/useUIStore';
import { createOrder } from '@/repositories';
import { formatCurrency, generateOrderNumber } from '@/utils/helpers';
import {
  FIRST_ORDER_PROMO,
  checkPromoCode,
  describeTotal,
  getOrderPricing,
  resolveQuantity,
  visibleOptions,
} from '@/utils/pricing';
import { PAYMENT_LABELS, isOnlinePayment, paymentChoices, startOnlinePayment } from '@/services/payments';
import { APP_COMMISSION_LABEL } from '@/config/commission';

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
  const addOrder = useOrderStore((state) => state.addOrder);
  const showToast = useUIStore((state) => state.showToast);

  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState(profile.address || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Required choices (ممرض/ممرضة, المرحلة, …): option id → chosen value
  // An option with one choice left (a teacher who teaches one stage) is already chosen
  // Choices made before the form opened (the group picked on a teacher's card) come first
  const [selected, setSelected] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(
      (data?.options ?? []).filter((o) => o.choices.length === 1).map((o) => [o.id, o.choices[0]])
    ),
    ...(data?.preselected ?? {}),
  }));
  const [quantity, setQuantity] = useState<number>(data?.quantity?.min ?? 1);
  const [submitting, setSubmitting] = useState(false);
  // An option with `showWhen` is asked only after its trigger answer (which group, for a group)
  const serviceOptions = visibleOptions(data?.options, selected);

  if (!isOpen || !data) return null;

  const pricing = getOrderPricing(data, discountApplied, { selections: selected, quantity });
  const { basePrice, discountAmount, finalPrice, isEstimate, unitPrice, amount, deliveryFee, priceLabel, commission, totalToPay } =
    pricing;
  const unit = resolveQuantity(data.quantity, selected)?.unit;
  // Card and wallet charge a known amount, so they need a fixed price
  const paymentOptions = paymentChoices(!isEstimate && (totalToPay ?? 0) > 0);
  const payWith: PaymentMethod = paymentOptions.includes(paymentMethod) ? paymentMethod : 'cash';
  const servicePriceLabel =
    priceLabel ||
    (data.quantity || deliveryFee > 0
      ? unitPrice == null
        ? 'حسب الطلب'
        : formatCurrency(unitPrice)
      : data.price || (basePrice == null ? 'حسب الطلب' : formatCurrency(basePrice)));

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate Step 1 with Zod
    const validation = orderFormSchema.safeParse({
      address,
      phone,
      notes,
      paymentMethod: payWith,
      discountCode,
    });

    const fieldErrors: Record<string, string> = {};
    for (const option of serviceOptions) {
      if (!selected[option.id]) fieldErrors[`option_${option.id}`] = `اختار ${option.label}`;
    }
    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        if (err.path[0] && !fieldErrors[String(err.path[0])]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      showToast('⚠️ من فضلك كمّل البيانات المطلوبة');
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

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Re-check at submit time in case another order was placed meanwhile
    const promoStillValid =
      discountApplied &&
      checkPromoCode(discountCode, {
        orders,
        usedPromoCodes,
        discountableAmount: pricing.discountableAmount,
      }).ok;
    const finalPricing = getOrderPricing(data, promoStillValid, { selections: selected, quantity });
    const appliedDiscount = finalPricing.discountAmount;
    // What the customer pays, عمولة التطبيق included (null: price set after confirmation)
    const total = finalPricing.totalToPay;

    const orderNum = generateOrderNumber();
    setSubmitting(true);
    let order;
    try {
      order = await createOrder({
          orderNumber: orderNum,
          serviceName: data.name,
          serviceEmoji: data.emoji,
          address,
          phone,
          notes,
          paymentMethod: payWith,
          discountCode: promoStillValid ? FIRST_ORDER_PROMO : undefined,
          discountAmount: appliedDiscount,
          totalAmount: total,
          commissionAmount: finalPricing.commission,
          isEstimate,
          status: 'pending',
          options:
            serviceOptions.length || data.quantity
              ? [
                  ...serviceOptions.map((o) => ({ label: o.label, value: selected[o.id] })),
                  ...(data.quantity ? [{ label: 'العدد', value: `${amount} ${unit ?? ''}`.trim() }] : []),
                ]
              : undefined,
          serviceId: data.serviceId,
          providerId: data.providerId,
      });
    } catch (err) {
      // Not saved: keep the form open with what the customer typed
      setSubmitting(false);
      showToast(`⚠️ ${err instanceof Error ? err.message : 'حصلت مشكلة، والطلب ماتبعتش'}`);
      return;
    }
    addOrder(order);

    if (promoStillValid) {
      markPromoUsed(FIRST_ORDER_PROMO);
    }

    // +10 reward points per order, but not for an order that ends up free
    if (total !== 0) {
      addRewardPoints(10);
    }

    if (isOnlinePayment(payWith)) {
      // Opens Paymob; the order turns paid only when Paymob's webhook confirms it
      const problem = await startOnlinePayment(order.id);
      if (!problem) return;
      showToast(`⚠️ ${problem}`);
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
            {serviceOptions.map((option) => {
              const errorId = `option_${option.id}`;
              return (
                <fieldset key={option.id} className="form-group border-0 p-0 m-0 min-w-0" aria-describedby={errors[errorId] ? `${errorId}Error` : undefined}>
                  <legend className="text-sm font-bold mb-2">{option.label} *</legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={option.label}>
                    {option.choices.map((choice) => {
                      const isOn = selected[option.id] === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          role="radio"
                          aria-checked={isOn}
                          onClick={() => setSelected((prev) => ({ ...prev, [option.id]: choice }))}
                          className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${
                            isOn ? 'bg-green text-white border-green' : 'bg-white text-text border-gray-200 hover:border-green'
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  {errors[errorId] && (
                    <span id={`${errorId}Error`} className="input-error-msg">{errors[errorId]}</span>
                  )}
                </fieldset>
              );
            })}

            {data.quantity && (
              <div className="form-group">
                <span className="text-sm font-bold mb-2 block">العدد ({unit})</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="أقل"
                    disabled={quantity <= data.quantity.min}
                    onClick={() => setQuantity((q) => Math.max(data.quantity!.min, q - data.quantity!.step))}
                    className="w-9 h-9 rounded-full border-2 border-gray-200 font-black disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="font-black text-lg min-w-8 text-center" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="أكتر"
                    disabled={quantity >= data.quantity.max}
                    onClick={() => setQuantity((q) => Math.min(data.quantity!.max, q + data.quantity!.step))}
                    className="w-9 h-9 rounded-full border-2 border-gray-200 font-black disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

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
          <form onSubmit={(e) => void handleFinalSubmit(e)} className="flex flex-col gap-4">
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
                value={payWith}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
              >
                {paymentOptions.map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_LABELS[method]}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-xl p-3.5 mb-4">
              {serviceOptions.map((option) => (
                <div key={option.id} className="flex justify-between text-sm mb-1.5">
                  <span>{option.label}:</span>
                  <span className="font-bold">{selected[option.id]}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm mb-1.5">
                <span>سعر الخدمة:</span>
                <span>
                  {servicePriceLabel}
                  {data.quantity && amount > 1 && ` × ${amount} ${unit ?? ''}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm mb-1.5">
                  <span>التوصيل:</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              {discountApplied && discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-1.5 text-success font-bold">
                  <span>خصم كود {FIRST_ORDER_PROMO}:</span>
                  <span>-{formatCurrency(discountAmount)} (100% مجاناً)</span>
                </div>
              )}
              {commission > 0 && (
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{APP_COMMISSION_LABEL}:</span>
                  <span>{formatCurrency(commission)}</span>
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
                <strong>{describeTotal(totalToPay, isEstimate, formatCurrency, commission)}</strong>
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

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
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
