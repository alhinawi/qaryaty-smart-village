// ─── Imports
import React, { useEffect } from 'react';
import type { OrderFormData, OrderModalData } from '@/types';
import { OrderForm } from './OrderForm';

// ─── Types
interface OrderModalProps {
  isOpen: boolean;
  data: OrderModalData | null;
  formData: OrderFormData;
  onFormChange: (fields: Partial<OrderFormData>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

// ─── Render
export function OrderModal({
  isOpen,
  data,
  formData,
  onFormChange,
  onSubmit,
  onClose,
}: OrderModalProps) {
  // Lock background scroll & handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="overlay open"
      id="overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      aria-describedby="modalDesc"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" aria-hidden="true" />
        <div className="modal-emoji" role="img" aria-label="أيقونة الخدمة">
          {data.emoji || '🛵'}
        </div>
        <h3 id="modalTitle">{data.name || 'اطلب خدمة'}</h3>
        <p id="modalDesc">
          {data.desc || 'املي البيانات وهنبعتلك حد في أسرع وقت'}
        </p>

        <OrderForm
          formData={formData}
          onChange={onFormChange}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
