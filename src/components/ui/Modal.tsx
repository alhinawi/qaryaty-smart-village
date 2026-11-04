// ─── Imports
import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
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
  // The body scrolls on its own so the title and close button stay in view
  const bodyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
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
    const scrollTop = bodyRef.current?.scrollTop ?? 0;
    startYRef.current = scrollTop <= 0 ? e.touches[0].clientY : null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startYRef.current;

    // If dragged down by more than 80px from the top, close modal
    if (diff > 80 && (bodyRef.current?.scrollTop ?? 0) <= 0) {
      onClose();
    }
    startYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-6 pt-[max(1rem,env(safe-area-inset-top))] animate-[fadeIn_0.2s_ease]"
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
        className="outline-none bg-white rounded-t-3xl md:rounded-2xl w-full flex flex-col max-h-[92dvh] md:max-h-[85vh] overflow-hidden text-right animate-[springUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header: handle, close button, icon and title; never scrolls away */}
        <div
          ref={headerRef}
          className="relative shrink-0 px-4 pt-2.5 pb-3 sm:px-6 md:pt-5 border-b border-transparent transition-colors data-[scrolled=true]:border-gray-100 data-[scrolled=true]:shadow-[0_4px_12px_-8px_rgba(0,0,0,0.25)]"
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-1 md:hidden" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 left-2 md:top-3 md:left-3 w-11 h-11 rounded-full flex items-center justify-center text-text-muted hover:bg-gray-100 hover:text-text transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={20} aria-hidden="true" />
          </button>
          {emoji && (
            <div
              className="text-[30px] sm:text-[42px] leading-none text-center mt-1 mb-1.5"
              role="img"
              aria-label="أيقونة النافذة"
            >
              {emoji}
            </div>
          )}
          {title ? (
            <h3
              id={titleId}
              className="text-lg sm:text-xl font-black text-center leading-snug text-text px-10 text-balance m-0"
            >
              {title}
            </h3>
          ) : (
            !emoji && <div className="h-8" aria-hidden="true" />
          )}
        </div>
        <div
          ref={bodyRef}
          onScroll={(e) => {
            // A divider under the header once the content slides beneath it
            if (headerRef.current) headerRef.current.dataset.scrolled = String(e.currentTarget.scrollTop > 4);
          }}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-6"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
