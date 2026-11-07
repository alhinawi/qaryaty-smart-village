import{useRestockDemo}from'@/components/stock/restockDemo';
// ─── Imports

import { useState, useEffect, useCallback, useMemo } from "react";
import { Menu, Search, X, Mic } from "lucide-react";

import { mergeNotifications, withoutSampleNotifications, useUIStore } from "@/stores/useUIStore";
import { useTrackingDemoMode } from "@/hooks/useTrackingDemoMode";
import { useGoToTab, useActiveTab } from '@/hooks/useTabNavigation';

import { useCartStore } from "@/stores/useCartStore";
import { Link, useLocation } from "react-router";
import { useAuthStore, selectUser } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { DEFAULT_VILLAGE, knownVillage, villageLabel } from "@/data/villages";
import { ROUTES } from "@/routes";
import { MobileMenu } from "./MobileMenu";
import { preloadSearchScreen } from "@/components/search/loadSearchScreen";

import type { ActiveTab } from "@/types";

// ─── Component

export function Header() {
  const activeTab = useActiveTab();
  const { pathname } = useLocation();

  const setActiveTab = useGoToTab();

  const user = useAuthStore(selectUser);
  const profileVillage = useUserStore((s) => s.profile.village);
  const firstName = user?.name.split(" ")[0] ?? "";

  const searchQuery = useUIStore((state) => state.searchQuery);

  const setSearchQuery = useUIStore((state) => state.setSearchQuery);

  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const setIsSearchOpen = useUIStore((state) => state.setIsSearchOpen);

  const remoteNotifs = useUIStore((state) => state.remoteNotifications);
  const localNotifs = useUIStore((state) => state.notifications);
  const demoOn = useTrackingDemoMode();
  const restockScope=useAuthStore(s=>s.session?.user.id??'guest');
  const restockNotices=useRestockDemo(s=>s.notices);
  const notifications = useMemo(
    () => [...(demoOn?restockNotices.filter(n=>n.scope===restockScope).map(n=>n.notification):[]),...withoutSampleNotifications(mergeNotifications(remoteNotifs, localNotifs), demoOn)],
    [remoteNotifs, localNotifs, demoOn,restockNotices,restockScope]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const setIsNotificationsOpen = useUIStore(
    (state) => state.setIsNotificationsOpen,
  );

  const totalCartCount = useCartStore((state) => state.getTotalCount());

  const cartWiggle = useCartStore((state) => state.cartWiggle);

  const setIsCartOpen = useUIStore((state) => state.setIsCartOpen);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsMenuOpen(false), [setIsMenuOpen]);
  // Pages reached from the menu light up the ☰ button
  const isMenuPage =
    [ROUTES.messages, ROUTES.about, ROUTES.groups, ROUTES.donate, ROUTES.admin].some((path) => pathname === path) ||
    pathname.startsWith(ROUTES.jobs) ||
    pathname.startsWith('/market/') ||
    pathname.startsWith(ROUTES.rides);

  // Load the search screen's code while the phone is idle, so it opens at once
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2500));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => void preloadSearchScreen());
    return () => cancel(id);
  }, []);

  const navLinks: {
    id: ActiveTab;
    label: string;
    icon: string;
  }[] = [
    { id: "home", label: "الرئيسية", icon: "🏠" },
    { id: "orders", label: "طلباتي", icon: "📋" },
    { id: "favorites", label: "المفضلة", icon: "❤️" },
    { id: "messages", label: "الرسائل", icon: "💬" },
    { id: "profile", label: user ? firstName : "حسابي", icon: "👤" },
  ];

  return (
    <header className="bg-linear-to-br from-green-dark to-green sticky top-0 z-100 shadow-card w-full">
      <div className="w-[min(100%-1.5rem,1200px)] mx-auto py-3">
        {/* Top Section */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Village Name */}
          <a
            className="flex items-center gap-2 sm:gap-3 min-w-0 select-none cursor-pointer"
            href={ROUTES.home}
          >
            <div
              className="w-[44px] h-[44px] bg-gold rounded-xl flex items-center justify-center text-[24px] shrink-0"
              role="img"
              aria-label="أيقونة قريتي"
            >
              🏡
            </div>

            {/* Brand Text */}
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-black text-white font-['Tajawal',sans-serif] leading-[1.2]">
                قريتي
              </h1>

              <span className="text-xs text-white/80 block truncate">
                📍 {villageLabel(knownVillage(user?.village ?? profileVillage) ?? DEFAULT_VILLAGE)}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-2"
            aria-label="التنقل الرئيسي"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`inline-flex items-center gap-[0.4rem] font-bold px-3.5 py-2  rounded-xl bg-transparent border-none font-['Cairo',sans-serif]  text-[0.9375rem] duration-200 cursor-pointer transition-colors hover:bg-white/15 ${
                  activeTab === link.id
                    ? "bg-white/25 text-gold-light "
                    : "text-white/85"
                }`}
                aria-current={activeTab === link.id ? 'page' : undefined}
                onClick={() => setActiveTab(link.id)}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              className="w-[40px] h-[40px] rounded-xl bg-white/15 border-none cursor-pointer flex items-center justify-center text-[18px] text-white transition-all duration-200 relative font-['Cairo',sans-serif] hover:bg-white/25 hover:scale-105"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label={`الإشعارات (${unreadCount} غير مقروءة)`}
            >
              <span role="img" aria-hidden="true">
                🔔
              </span>

              {unreadCount > 0 && (
                <span aria-hidden="true" className="absolute -top-1 -right-1 bg-gold text-black rounded-xl w-[18px] h-[18px] text-[10px] font-extrabold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`w-[40px] h-[40px] rounded-xl bg-white/15 border-none cursor-pointer flex items-center justify-center text-[18px] text-white transition-all duration-200 relative font-['Cairo',sans-serif] hover:bg-white/25 hover:scale-105 ${
                cartWiggle ? "animate-[cartWiggleAnim_0.5s_ease-in-out]" : ""
              }`}
              onClick={() => setIsCartOpen(true)}
              aria-label={`سلة المشتريات (${totalCartCount} عناصر)`}
            >
              <span role="img" aria-hidden="true">
                🛒
              </span>

              {totalCartCount > 0 && (
                <span aria-hidden="true" className="absolute -top-1 -right-1 bg-gold text-black rounded-xl w-[18px] h-[18px] text-[10px] font-extrabold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Account: login when signed out, the user's initial when signed in */}
            {user ? (
              <Link
                to={ROUTES.profile}
                className="hidden lg:flex w-[40px] h-[40px] rounded-xl bg-gold text-black items-center justify-center text-[16px] font-black font-['Tajawal',sans-serif] transition-all duration-200 hover:scale-105"
                aria-label={`حسابي: ${user.name}`}
                title={user.name}
              >
                {firstName.charAt(0)}
              </Link>
            ) : (
              <Link
                to={ROUTES.login}
                className="hidden lg:flex h-[40px] px-2.5 sm:px-3 rounded-xl bg-gold text-black items-center justify-center text-[13px] font-extrabold font-['Cairo',sans-serif] whitespace-nowrap transition-all duration-200 hover:scale-105"
              >
                دخول
              </Link>
            )}

            {/* Menu (phones and tablets): messages, About, groups and the account
                live here so the header keeps only notifications and the cart */}
            <button
              type="button"
              className={`lg:hidden w-[44px] h-[44px] rounded-xl border-none cursor-pointer flex items-center justify-center text-white transition-colors duration-200 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light ${
                isMenuOpen || isMenuPage ? "bg-white/30" : "bg-white/15"
              }`}
              onClick={() => setIsMenuOpen(true)}
              aria-label="القايمة"
              aria-haspopup="dialog"
              aria-expanded={isMenuOpen}
              aria-controls={isMenuOpen ? "mobile-menu" : undefined}
            >
              <Menu size={24} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </div>
        </div>

        <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />

        {/* Search bar: opens the full search screen */}
        <div className="mt-2.5 relative flex items-center">
          <button
            type="button"
            onClick={() => { useUIStore.getState().setVoiceSearchRequested(false); setIsSearchOpen(true); }}
            onPointerEnter={() => void preloadSearchScreen()}
            onFocus={() => void preloadSearchScreen()}
            aria-haspopup="dialog"
            aria-expanded={isSearchOpen}
            aria-label={searchQuery ? `البحث: ${searchQuery}` : "دور على خدمة أو محل (مثل: عيش، سباك، شوي سمك)..."}
            className="flex-1 min-w-0 flex items-center gap-2.5 bg-white/14 rounded-xl ps-3.5 pe-22 py-2.25 min-h-[44px] border border-white/22 text-start cursor-pointer font-['Cairo',sans-serif] text-[0.9375rem] transition-colors duration-200 hover:bg-white/20 hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light"
          >
            <Search size={18} strokeWidth={2.5} className="text-white/85 shrink-0" aria-hidden="true" />
            <span className={`truncate ${searchQuery ? "text-white font-bold" : "text-white/65"}`}>
              {searchQuery || "دور على خدمة أو محل (مثل: عيش، سباك، شوي سمك)..."}
            </span>
          </button>

          <button type="button" aria-label="البحث بالصوت" onClick={() => { useUIStore.getState().setVoiceSearchRequested(true); setIsSearchOpen(true); }} className="absolute end-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-white flex items-center justify-center hover:bg-white/15"><Mic size={19} aria-hidden="true" /></button>
          {searchQuery && (
            <button
              type="button"
              className="absolute end-11 top-1/2 -translate-y-1/2 w-[36px] h-[36px] rounded-lg bg-transparent border-none text-white/80 cursor-pointer flex items-center justify-center hover:bg-white/15 hover:text-white"
              onClick={() => setSearchQuery("")}
              aria-label="مسح البحث"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
