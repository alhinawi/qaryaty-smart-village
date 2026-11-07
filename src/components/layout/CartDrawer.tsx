// ─── Imports
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductPhoto } from "@/components/ui/ProductPhoto";
import { useCartStore } from "@/stores/useCartStore";
import { createOrder,getProducts,offersRepo } from "@/repositories";
import {repriceCart,cartPriceChanged} from "@/repositories/offers/revalidateCart";
import {useAuthStore} from '@/stores/useAuthStore';
import {isTrackingDemoMode} from '@/config/demoMode';
import {createLocalOffersRepo} from '@/repositories/offers/localOffersRepo';
import {createMockOrderRepo} from '@/repositories/orders/mockOrderRepo';
import {useCatalogStore} from "@/stores/useCatalogStore";
import AddressChooser from "@/components/address/AddressChooser";
import type { LatLng } from "@/types";
import { PAYMENT_LABELS, isOnlinePayment, paymentChoices, startOnlinePayment } from "@/services/payments";
import { useUIStore } from "@/stores/useUIStore";
import { ensureProfileForOrder } from "@/stores/useProfilePromptStore";
import { useGoToTab } from '@/hooks/useTabNavigation';
import { useOrderStore } from "@/stores/useOrderStore";
import { useUserStore } from "@/stores/useUserStore";
import { orderFormSchema } from "@/utils/validators";
import { formatCurrency, generateOrderNumber } from "@/utils/helpers";
import {
  FIRST_ORDER_PROMO,
  FIRST_ORDER_PROMO_APPLIED,
  FIRST_ORDER_PROMO_TEXT,
  WAIVED_FEES_LABEL,
  checkPromoCode,
  describeTotal,
  getCartItemPriceType,
  getCartPricing,
} from "@/utils/pricing";
import type { CartItem, PaymentMethod } from "@/types";
import { APP_COMMISSION_LABEL, APP_COMMISSION_PERCENT } from "@/config/commission";
import { DELIVERY_FEE_DEFAULT,DELIVERY_FEE_LABEL } from "@/config/delivery";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";
import { PhoneInput } from "@/components/ui/PhoneInput";

// ─── Component
// The content only mounts while the drawer is open, so the promo code,
// discount and form fields start fresh each time (and after checkout).
export function CartDrawer() {
  const isOpen = useUIStore((state) => state.isCartOpen);
  if (!isOpen) return null;
  return <CartDrawerContent />;
}

function formatQuantity(item: CartItem): string {
  return item.unit ? `${item.quantity.toLocaleString("ar-EG")} ${item.unit}` : "";
}

function formatLinePrice(item: CartItem): string {
  const type = getCartItemPriceType(item);
  if (type === "quote") return "السعر بعد التأكيد";
  if (!item.unit) return type === "from" ? `من ${formatCurrency(item.price)}` : formatCurrency(item.price);
  const line = `${formatCurrency(item.price)} × ${formatQuantity(item)} = ${formatCurrency(
    item.price * item.quantity,
  )}`;
  return type === "from" ? `من ${line}` : line;
}

function CartDrawerContent() {
  const offerScope=useAuthStore(s=>s.session?.user.id??'guest');
  const setIsOpen = useUIStore((state) => state.setIsCartOpen);
  const showToast = useUIStore((state) => state.showToast);
  const setActiveTab = useGoToTab();

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const orders = useOrderStore((state) => state.orders);
  const addOrder = useOrderStore((state) => state.addOrder);

  const profile = useUserStore((state) => state.profile);
  const usedPromoCodes = useUserStore((state) => state.usedPromoCodes);
  const markPromoUsed = useUserStore((state) => state.markPromoUsed);
  const addRewardPoints = useUserStore((state) => state.addRewardPoints);

  const [promoCode, setPromoCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [address, setAddress] = useState(profile.address || "");
  const [mapPoint, setMapPoint] = useState<LatLng | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [phone, setPhone] = useState(profile.phone || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const close = () => setIsOpen(false);

  // A shop cart is priced by the server from its product list; a service cart as before
  const demoOnly=items.some(i=>i.demoOnly);
  const shopId = items[0]?.shopId;
  const shopItems =
    shopId !== undefined && items.every((i) => i.shopId === shopId && i.productId)
      ? items.map((i) => ({ productId: i.productId as string, quantity: i.quantity, grill: i.grill,expectedUnitPrice:i.price,offerId:i.offerId }))
      : undefined;
  // رسوم التوصيل: a shop cart is brought to the door; a service cart never pays it
  const quotedDeliveryFee = useDeliveryFee(!demoOnly&&shopItems ? shopId : undefined);
  const deliveryFee=demoOnly?DELIVERY_FEE_DEFAULT:quotedDeliveryFee;
  const pricing = getCartPricing(items, discountApplied, deliveryFee);
  // Card and wallet charge a known amount, so they need a fixed total
  const paymentOptions = demoOnly?["cash" as const]:paymentChoices(!pricing.isEstimate && (pricing.totalToPay ?? 0) > 0);
  const payWith: PaymentMethod = paymentOptions.includes(paymentMethod) ? paymentMethod : "cash";
  // عمولة التطبيق is in the total here, at checkout, and nowhere before
  const totalLabel = describeTotal(
    pricing.totalToPay,
    pricing.isEstimate,
    formatCurrency,
    pricing.feesWaived ? 0 : APP_COMMISSION_PERCENT,
  );

  const promoContext = { orders, usedPromoCodes };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const result = checkPromoCode(promoCode, promoContext);
    if (result.ok) {
      setDiscountApplied(true);
      showToast(FIRST_ORDER_PROMO_APPLIED);
    } else {
      showToast(result.message);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || submitting) return;
    const initialScope=useOrderStore.getState().scopeVersion;
    setErrors({});
    if(demoOnly&&(!isTrackingDemoMode()||!items.every(i=>i.demoOnly))){showToast('الطلب التجريبي متوقف. فضّي السلة وافتح المحل من جديد');return;}
    if(shopItems&&shopId!=null){
      setSubmitting(true);
      try{
        const shop=useCatalogStore.getState().shops.find(s=>s.id===shopId);
        if(!shop)throw Error('افتح المحل من جديد عشان نراجع السعر');
        const [products,offer]=await Promise.all([getProducts(shop),(demoOnly?createLocalOffersRepo(offerScope):offersRepo).mineForShop(shop.id)]);
        const offers=offer?[offer]:[];
        if(!products)throw Error('مش قادرين نراجع أسعار المحل دلوقتي');
        if(useOrderStore.getState().scopeVersion!==initialScope){showToast("الحساب اتغيّر، راجع السلة من جديد");return;}
        if(useCartStore.getState().items!==items){showToast("السلة اتعدلت، راجعها وأكد تاني");return;}
        const next=repriceCart(items,products,offers);
        if(cartPriceChanged(items,next)){
          useCartStore.setState({items:next});
          showToast('السعر أو العرض اتغيّر. راجع الإجمالي الجديد واضغط تأكيد تاني');
          return;
        }
      }catch(error){showToast(error instanceof Error?error.message:'تعذر مراجعة السعر');return;}
      finally{setSubmitting(false);}
    }
    // A Google account gives its phone, village and address first (a sheet over the
    // cart); its default address and phone then fill in here, and one more tap orders
    if (!ensureProfileForOrder()) return;

    // Same rules as the single-service order form (PRD section 12)
    const validation = orderFormSchema.safeParse({
      address,
      phone,
      notes: "",
      paymentMethod: payWith,
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
    const finalPricing = getCartPricing(items, promoStillValid, deliveryFee);
    const total = finalPricing.totalToPay;

    const vendor = useCartStore.getState().getVendor();
    const names = items
      .map((i) => (i.unit ? `${i.name} (${formatQuantity(i)})` : i.name))
      .join(" + ");
    const emojis = items
      .map((i) => i.emoji)
      .slice(0, 3)
      .join(" ");

    setSubmitting(true);
    const orderScope = useOrderStore.getState().scopeVersion;
    let newOrder;
    try {
      newOrder = await (demoOnly?createMockOrderRepo(offerScope).createOrder:createOrder)({
        orderNumber: generateOrderNumber(),
        serviceName: vendor && items[0]?.shopId ? `${vendor.name}: ${names}` : names,
        serviceEmoji: emojis || "🛒",
        address: validation.data.address,
        phone: validation.data.phone,
        ...(mapPoint ? { lat: mapPoint.lat, lng: mapPoint.lng } : {}),
        paymentMethod: validation.data.paymentMethod,
        discountCode: promoStillValid ? FIRST_ORDER_PROMO : undefined,
        discountAmount: finalPricing.discountAmount,
        totalAmount: total,
        commissionAmount: finalPricing.commission,
        deliveryFee: finalPricing.deliveryFee,
        isEstimate: finalPricing.isEstimate,
        status: "pending",
        ...(shopItems ? { shopId, items: shopItems } : {}),
      });
    } catch (err) {
      // Not saved: keep the cart as it is
      setSubmitting(false);
      showToast(`⚠️ ${err instanceof Error ? err.message : "حصلت مشكلة، والطلب ماتبعتش"}`);
      return;
    }
    if (!addOrder(newOrder, orderScope)) {
      setSubmitting(false);
      showToast('الطلب اتسجل، لكن الحساب اتغيّر. مش هنعرض بياناته في الحساب الحالي.');
      return;
    }
    setSubmitting(false);

    if (promoStillValid&&!demoOnly) {
      markPromoUsed(FIRST_ORDER_PROMO);
    }
    // Same rule as the order modal: +10 points, except for a free order
    if (total !== 0&&!demoOnly) {
      addRewardPoints(10);
    }

    clearCart();
    if (isOnlinePayment(validation.data.paymentMethod)) {
      // Opens Paymob; the order turns paid only when Paymob's webhook confirms it
      const problem = await startOnlinePayment(newOrder.id);
      if (!problem) return;
      showToast(`⚠️ ${problem}`);
    }
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
                className="flex flex-wrap items-center gap-3 p-2.5 bg-gray-50 rounded-xl"
              >
                <ProductPhoto photo={item.photo} emoji={item.emoji} />
                <div className="flex-1 min-w-[120px]">
                  <h3 className="text-sm font-extrabold">{item.name}</h3>
                  <div className="text-xs text-text-muted">
                    {item.originalPrice!=null&&<span className="block mb-1">قبل الخصم <del>{formatCurrency(item.originalPrice)}</del></span>}<span>{formatLinePrice(item)}</span>
                  </div>
                </div>

                {/* Quantity: only for things ordered by a unit (kilo, hour, month) */}
                {item.unit && (
                  <div className="flex items-center gap-1.5 ms-auto">
                    <button
                      type="button"
                      className="w-11 h-11 rounded-md bg-white border border-gray-300 flex items-center justify-center font-extrabold cursor-pointer"
                      onClick={() => updateQuantity(item.id, item.quantity - (item.step ?? 1))}
                      aria-label={`أقل ${item.name}`}
                    >
                      -
                    </button>
                    <span className="text-sm font-extrabold min-w-[52px] text-center" aria-live="polite">
                      {formatQuantity(item)}
                    </span>
                    <button
                      type="button"
                      className="w-11 h-11 rounded-md bg-white border border-gray-300 flex items-center justify-center font-extrabold cursor-pointer"
                      onClick={() => updateQuantity(item.id, item.quantity + (item.step ?? 1))}
                      aria-label={`أكتر ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  className="bg-transparent border-none text-[16px] cursor-pointer w-11 h-11 flex items-center justify-center shrink-0"
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
              🎟️ كود الخصم (كود {FIRST_ORDER_PROMO}: {FIRST_ORDER_PROMO_TEXT})
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
            <AddressChooser
                id="cartAddress"
                label="📍 عنوان التوصيل *"
                value={{ address, point: mapPoint, addressId }}
                onChange={(next) => {
                  setAddress(next.address);
                  setMapPoint(next.point);
                  setAddressId(next.addressId);
                }}
                onPhone={setPhone}
                error={errors.address}
              />
            <div className="form-group">
              <label htmlFor="cartPhone">📱 رقم الموبايل للتواصل *</label>
              <PhoneInput
                id="cartPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={errors.phone ? "is-invalid" : ""}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "cartPhoneError" : undefined}
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
                value={payWith}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {paymentOptions.map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_LABELS[method]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-xl p-3.5 mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span>المجموع الفرعي:</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
            {pricing.feesWaived && (
              <div className="flex justify-between text-sm mb-1.5 text-success font-bold">
                <span>{WAIVED_FEES_LABEL}:</span>
                <span>
                  {pricing.discountAmount > 0 && (
                    <s className="text-text-muted font-normal ml-1">
                      {formatCurrency(pricing.discountAmount)}
                    </s>
                  )}
                  ببلاش
                </span>
              </div>
            )}
            {pricing.commission > 0 && (
              <div className="flex justify-between text-sm mb-1.5">
                <span>{APP_COMMISSION_LABEL}:</span>
                <span>{formatCurrency(pricing.commission)}</span>
              </div>
            )}
            {pricing.deliveryFee > 0 && (
              <div className="flex justify-between text-sm mb-1.5">
                <span>{DELIVERY_FEE_LABEL}:</span>
                <span>{formatCurrency(pricing.deliveryFee)}</span>
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
              onClick={() => void handleCheckout()}
              loading={submitting}
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
