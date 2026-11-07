// ─── Imports
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { ChevronLeft, X } from 'lucide-react';

import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import { useAuthStore, selectRole, selectUser } from '@/stores/useAuthStore';
import { mobileMenuSections } from '@/config/mobileMenu';
import { DEVELOPER_NAME } from '@/config/developer';
import { ROUTES } from '@/routes';
import { DeveloperLinks } from './DeveloperLinks';

import { ThemeSelector } from '@/components/shared/ThemeSelector';

// ─── Types
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ─── Component

/**
 * The phone/tablet menu (below lg). Slides in from the side of the ☰ button and
 * holds the secondary pages. Closes on Escape, the backdrop, the back button,
 * the ✕ button, any link, and when the screen grows to desktop width.
 */
export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const { pathname, hash } = useLocation();

  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectRole);
  const sections = mobileMenuSections({ role });

  // Android/browser back closes the menu instead of leaving the page
  useBackButtonClose(isOpen, onClose);

  // Focus the close button on open; give focus back (to ☰) on close
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previouslyFocused?.focus?.({ preventScroll: true });
  }, [isOpen]);

  // Lock the page behind, Escape closes, Tab stays inside the menu,
  // and widening to desktop (where the menu is hidden) closes it
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    const desktop = window.matchMedia('(min-width: 1024px)');
    const handleWiden = (e: MediaQueryListEvent) => {
      if (e.matches) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    desktop.addEventListener('change', handleWiden);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      desktop.removeEventListener('change', handleWiden);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCurrent = (to: string) => {
    const [path, section] = to.split('#');
    return section ? pathname === path && hash === `#${section}` : pathname === path && !hash;
  };

  const itemClass =
    'flex items-center gap-3 min-h-[52px] px-2.5 py-1.5 rounded-xl text-text transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-green';

  // Portalled to <body> so it sits above the sticky header and the bottom nav
  return createPortal(
    <div
      className="lg:hidden fixed inset-0 z-200 bg-black/50 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 left-0 w-[min(86vw,320px)] bg-white shadow-[8px_0_30px_rgba(0,0,0,0.18)] flex flex-col text-right animate-[menuSlideIn_0.25s_cubic-bezier(0.22,1,0.36,1)] pt-[env(safe-area-inset-top)]"
      >
        {/* Brand + close */}
        <div className="shrink-0 bg-linear-to-br from-green-dark to-green text-white px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-[40px] h-[40px] bg-gold rounded-xl flex items-center justify-center text-[22px] shrink-0"
              aria-hidden="true"
            >
              🏡
            </div>
            <div className="flex flex-col min-w-0">
              <h2 id={titleId} className="text-lg font-black font-['Tajawal',sans-serif] leading-tight m-0">
                قريتي
              </h2>
              <span className="text-[11px] text-white/80 truncate">خدمات قريتك كلها في مكان واحد</span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="w-11 h-11 shrink-0 rounded-xl bg-white/15 flex items-center justify-center text-white cursor-pointer border-none transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light"
            aria-label="قفل القايمة"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3" aria-label="القايمة">
          {/* Account: profile page, where guests sign in */}
          <Link
            to={ROUTES.profile}
            onClick={onClose}
            aria-current={pathname === ROUTES.profile ? 'page' : undefined}
            className="flex items-center gap-3 min-h-[60px] p-2.5 mb-2 rounded-2xl bg-cream border border-gold-light/60 text-text transition-colors hover:bg-[#f5eedd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            <span
              className="w-11 h-11 rounded-xl bg-gold text-black flex items-center justify-center text-[18px] font-black font-['Tajawal',sans-serif] shrink-0"
              aria-hidden="true"
            >
              {user ? user.name.trim().charAt(0) || '👤' : '👤'}
            </span>
            <span className="flex flex-col flex-1 min-w-0">
              <span className="text-[15px] font-extrabold truncate">{user ? user.name : 'حسابي'}</span>
              <span className="text-xs text-text-muted truncate">
                {user ? 'بياناتك ونقاطك' : 'سجّل دخولك أو اعمل حساب جديد'}
              </span>
            </span>
            <ChevronLeft size={18} className="text-text-muted shrink-0" aria-hidden="true" />
          </Link>

          <ThemeSelector />
          {sections.map((section) => (
            <div key={section.id} className="mt-2">
              {section.title && (
                <h3 className="text-[12px] font-extrabold text-text-muted px-2.5 pt-2 pb-1 m-0">{section.title}</h3>
              )}
              <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                {section.links.map((link) => {
                  const current = isCurrent(link.to);
                  return (
                    <li key={link.id}>
                      <Link
                        to={link.to}
                        onClick={onClose}
                        aria-current={current ? 'page' : undefined}
                        className={`${itemClass} ${current ? 'bg-green/8 text-green font-extrabold' : ''}`}
                      >
                        <span
                          className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-[19px] shrink-0"
                          aria-hidden="true"
                        >
                          {link.icon}
                        </span>
                        <span className="flex flex-col flex-1 min-w-0">
                          <span className="text-[15px] font-bold">{link.label}</span>
                          {link.hint && <span className="text-xs text-text-muted">{link.hint}</span>}
                        </span>
                        <ChevronLeft size={18} className="text-text-muted/70 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Developer */}
        <div className="shrink-0 border-t border-black/8 px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2">
          <p className="text-xs text-text-muted m-0">
            تطوير وتصميم{' '}
            <span className="font-extrabold text-green" dir="auto">
              {DEVELOPER_NAME}
            </span>
          </p>
          <DeveloperLinks tone="onLight" className="justify-center" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
