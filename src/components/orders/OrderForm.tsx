// ─── Imports
import React from 'react';
import type { OrderFormData, PaymentMethod } from '@/types';

// ─── Types
interface OrderFormProps {
  formData: OrderFormData;
  onChange: (fields: Partial<OrderFormData>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

// ─── Render
export function OrderForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
}: OrderFormProps) {
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ address: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ phone: e.target.value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ notes: e.target.value });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ paymentMethod: e.target.value as PaymentMethod });
  };

  const labelClass = "block text-sm font-bold mb-1.5 text-green-dark";
  const inputClass = "w-full px-3.5 py-3 border-2 border-[rgba(26,122,74,0.15)] rounded-xl font-['Cairo',sans-serif] text-sm outline-none transition-colors duration-200 bg-cream text-text [direction:rtl] focus:border-green focus:bg-white";

  return (
    <form onSubmit={onSubmit} aria-label="نموذج طلب الخدمة">
      {/* Address */}
      <div className="mb-4 text-right">
        <label htmlFor="addressInput" className={labelClass}>📍 عنوانك في القرية</label>
        <input
          id="addressInput"
          type="text"
          placeholder="مثال: شارع الجامع، أمام المدرسة"
          value={formData.address}
          onChange={handleAddressChange}
          autoComplete="street-address"
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div className="mb-4 text-right">
        <label htmlFor="phoneInput" className={labelClass}>📱 رقم موبايلك</label>
        <input
          id="phoneInput"
          type="tel"
          placeholder="01xxxxxxxxx"
          value={formData.phone}
          onChange={handlePhoneChange}
          autoComplete="tel"
          className={inputClass}
        />
      </div>

      {/* Optional Notes */}
      <div className="mb-4 text-right">
        <label htmlFor="notesInput" className={labelClass}>📝 تفاصيل إضافية (اختياري)</label>
        <textarea
          id="notesInput"
          placeholder="اكتب أي تفاصيل إضافية هنا..."
          value={formData.notes}
          onChange={handleNotesChange}
          className={inputClass}
        />
      </div>

      {/* Payment Method */}
      <div className="mb-4 text-right">
        <label htmlFor="payInput" className={labelClass}>💳 طريقة الدفع</label>
        <select
          id="payInput"
          value={formData.paymentMethod}
          onChange={handlePaymentChange}
          className={inputClass}
        >
          <option value="cash">كاش عند الاستلام 💵</option>
          <option value="vodafone">فودافون كاش 📱</option>
          <option value="instapay">انستاباي ⚡</option>
        </select>
      </div>

      {/* Submit Button */}
      <button type="submit" className="w-full bg-linear-to-br from-green to-green-light text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_16px_rgba(26,122,74,0.25)] transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(26,122,74,0.35)] mt-4">
        🚀 اطلب دلوقتي
      </button>

      {/* Cancel Button */}
      <button
        type="button"
        className="w-full bg-transparent border-2 border-gray-200 py-2.5 rounded-xl font-['Cairo',sans-serif] text-sm text-text-muted font-bold mt-2 transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
        onClick={onCancel}
      >
        إلغاء
      </button>
    </form>
  );
}
