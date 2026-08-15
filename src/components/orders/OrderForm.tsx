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

  return (
    <form onSubmit={onSubmit} aria-label="نموذج طلب الخدمة">
      {/* Address */}
      <div className="form-group">
        <label htmlFor="addressInput">📍 عنوانك في القرية</label>
        <input
          id="addressInput"
          type="text"
          placeholder="مثال: شارع الجامع، أمام المدرسة"
          value={formData.address}
          onChange={handleAddressChange}
          autoComplete="street-address"
        />
      </div>

      {/* Phone */}
      <div className="form-group">
        <label htmlFor="phoneInput">📱 رقم موبايلك</label>
        <input
          id="phoneInput"
          type="tel"
          placeholder="01xxxxxxxxx"
          value={formData.phone}
          onChange={handlePhoneChange}
          autoComplete="tel"
        />
      </div>

      {/* Optional Notes */}
      <div className="form-group">
        <label htmlFor="notesInput">📝 تفاصيل إضافية (اختياري)</label>
        <textarea
          id="notesInput"
          placeholder="اكتب أي تفاصيل إضافية هنا..."
          value={formData.notes}
          onChange={handleNotesChange}
        />
      </div>

      {/* Payment Method */}
      <div className="form-group">
        <label htmlFor="payInput">💳 طريقة الدفع</label>
        <select
          id="payInput"
          value={formData.paymentMethod}
          onChange={handlePaymentChange}
        >
          <option value="cash">كاش عند الاستلام 💵</option>
          <option value="vodafone">فودافون كاش 📱</option>
          <option value="instapay">انستاباي ⚡</option>
        </select>
      </div>

      {/* Submit Button */}
      <button type="submit" className="btn-order">
        🚀 اطلب دلوقتي
      </button>

      {/* Cancel Button */}
      <button
        type="button"
        className="btn-cancel"
        onClick={onCancel}
      >
        إلغاء
      </button>
    </form>
  );
}
