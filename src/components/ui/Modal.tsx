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
      className="overlay open"
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
        className="modal spring-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-handle" aria-hidden="true" />
        {emoji && (
          <div className="modal-emoji" role="img" aria-label="أيقونة النافذة">
            {emoji}
          </div>
        )}
        {title && (
          <h3 id="modal-dialog-title" className="modal-title">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
