// ─── Imports
import React, { useEffect, useRef } from 'react';

// ─── Types
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  emoji?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

// ─── Component
export function Modal({
  isOpen,
  onClose,
  title,
  emoji,
  children,
  maxWidth = '540px',
}: ModalProps) {
  const startYRef = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Touch gestures for mobile swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startYRef.current;

    // If dragged down by more than 80px, close modal
    if (diff > 80) {
      onClose();
    }
    startYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-6 animate-[fadeIn_0.2s_ease]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-dialog-title' : undefined}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-t-3xl md:rounded-2xl w-full p-6 max-h-[88svh] md:max-h-[85vh] overflow-y-auto text-right [animation:springUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" aria-hidden="true" />
        {emoji && (
          <div className="text-[50px] text-center mb-2" role="img" aria-label="أيقونة النافذة">
            {emoji}
          </div>
        )}
        {title && (
          <h3 id="modal-dialog-title" className="text-xl font-black text-center mb-2 text-text">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
