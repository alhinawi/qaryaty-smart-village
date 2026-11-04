// ─── Imports
import React, { useEffect, useId, useRef } from 'react';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';

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
  // Unique per modal so stacked dialogs don't share one id
  const titleId = useId();

  // Android/browser back closes the modal instead of leaving the page
  useBackButtonClose(isOpen, onClose);

  // Move focus into the dialog on open and give it back on close
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    modalRef.current?.focus({ preventScroll: true });
    return () => {
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

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
  // Only a swipe that starts while the sheet is scrolled to the top closes it,
  // so scrolling back up inside a long form never dismisses the modal.
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = modalRef.current?.scrollTop ?? 0;
    startYRef.current = scrollTop <= 0 ? e.touches[0].clientY : null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startYRef.current;

    // If dragged down by more than 80px from the top, close modal
    if (diff > 80 && (modalRef.current?.scrollTop ?? 0) <= 0) {
      onClose();
    }
    startYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-6 animate-[fadeIn_0.2s_ease]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="outline-none bg-white rounded-t-3xl md:rounded-2xl w-full p-6 max-h-[88svh] md:max-h-[85vh] overflow-y-auto text-right animate-[springUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
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
          <h3 id={titleId} className="text-xl font-black text-center mb-2 text-text">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
