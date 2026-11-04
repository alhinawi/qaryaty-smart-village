// ─── Imports

import React, { useState, useRef, useEffect } from "react";

import { useUIStore } from "@/stores/useUIStore";
import { useGoToTab, useActiveTab } from '@/hooks/useTabNavigation';

import { useCartStore } from "@/stores/useCartStore";

import type { ActiveTab } from "@/types";

// ─── Component

export function Header() {
  const activeTab = useActiveTab();

  const setActiveTab = useGoToTab();

  const searchQuery = useUIStore((state) => state.searchQuery);

  const setSearchQuery = useUIStore((state) => state.setSearchQuery);

  const searchHistory = useUIStore((state) => state.searchHistory);

  const addSearchHistory = useUIStore((state) => state.addSearchHistory);

  const removeSearchHistoryItem = useUIStore(
    (state) => state.removeSearchHistoryItem,
  );

  const notifications = useUIStore((state) => state.notifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const setIsNotificationsOpen = useUIStore(
    (state) => state.setIsNotificationsOpen,
  );

  const totalCartCount = useCartStore((state) => state.getTotalCount());

  const cartWiggle = useCartStore((state) => state.cartWiggle);

  const setIsCartOpen = useUIStore((state) => state.setIsCartOpen);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      addSearchHistory(searchQuery.trim());
      setIsSearchFocused(false);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    addSearchHistory(term);
    setIsSearchFocused(false);
  };

  const navLinks: {
    id: ActiveTab;
    label: string;
    icon: string;
  }[] = [
    { id: "home", label: "الرئيسية", icon: "🏠" },
    { id: "orders", label: "طلباتي", icon: "📋" },
    { id: "favorites", label: "المفضلة", icon: "❤️" },
    { id: "messages", label: "الرسائل", icon: "💬" },
    { id: "profile", label: "حسابي", icon: "👤" },
  ];

  return (
    <header className="bg-linear-to-br from-green-dark to-green sticky top-0 z-100 shadow-card w-full">
      <div className="w-[min(100%-1.5rem,1200px)] mx-auto py-3">
        {/* Top Section */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Village Name */}
          <div
            className="flex items-center gap-2 sm:gap-3 min-w-0 select-none cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab("home")}
          >
            <div
              className="w-[44px] h-[44px] bg-gold rounded-xl flex items-center justify-center text-[24px] shrink-0"
              role="img"
              aria-label="أيقونة قريتي"
            >
              🏡
            </div>

            {/* Brand Text */}
            <div className="flex flex-col gap-1">
              <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-black text-white font-['Tajawal',sans-serif] leading-[1.2]">
                قريتي
              </h1>

              <span className="text-xs text-white/80 block">
                📍 قرية البركة - الجيزة
              </span>
            </div>
          </div>

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
                onClick={() => setActiveTab(link.id)}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Messages: the desktop nav (lg+) has it, but the bottom nav has no room,
                so mobile gets it here (review item 7). */}
            <button
              type="button"
              className={`lg:hidden w-[40px] h-[40px] rounded-xl border-none cursor-pointer flex items-center justify-center text-[18px] text-white transition-all duration-200 relative font-['Cairo',sans-serif] hover:bg-white/25 hover:scale-105 ${
                activeTab === "messages" ? "bg-white/30" : "bg-white/15"
              }`}
              onClick={() => setActiveTab("messages")}
              aria-label="الرسائل"
              aria-current={activeTab === "messages" ? "page" : undefined}
            >
              <span role="img" aria-hidden="true">
                💬
              </span>
            </button>

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
                <span className="absolute -top-1 -right-1 bg-gold text-black rounded-xl w-[18px] h-[18px] text-[10px] font-extrabold flex items-center justify-center">
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
                <span className="absolute -top-1 -right-1 bg-gold text-black rounded-xl w-[18px] h-[18px] text-[10px] font-extrabold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-2.5 relative" ref={searchContainerRef}>
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2.5 bg-white/14 rounded-xl px-3.5 py-2.25 border border-white/22 transition-all duration-200 focus-within:bg-white/20 focus-within:border-white/40"
          >
            <span role="img" aria-hidden="true">
              🔍
            </span>

            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-white font-['Cairo',sans-serif] text-[0.9375rem] rtl:direction-rtl placeholder:text-white/65"
              placeholder="دور على خدمة أو محل (مثل: عيش، سباك، شوي سمك)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              aria-label="البحث عن خدمة أو محل"
            />

            {searchQuery && (
              <button
                type="button"
                className="bg-transparent border-none text-white/70 cursor-pointer text-sm p-[0.2rem]"
                onClick={() => setSearchQuery("")}
                aria-label="مسح البحث"
              >
                ✕
              </button>
            )}
          </form>

          {/* Search History Suggestions Dropdown */}
          {isSearchFocused && searchHistory.length > 0 && (
            <div className="absolute top-[calc(100%+6px)] inset-x-0 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-black/8 z-150 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              <div className="px-3.5 py-2 text-[0.8125rem] text-text-muted font-bold bg-[#f9fafb] border-b border-[#f3f4f6]">
                <span>🕒 آخر عمليات البحث</span>
              </div>

              <ul className="list-none m-0 p-0">
                {searchHistory.map((term, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between border-b border-[#f9fafb] last:border-b-0"
                  >
                    <button
                      type="button"
                      className="flex-1 flex items-center gap-2 px-3.5 py-2.5 border-none bg-transparent text-right font-['Cairo',sans-serif] text-[0.875rem] text-text cursor-pointer transition-colors duration-150 hover:bg-[#f0fdf4] hover:text-green"
                      onClick={() => handleSuggestionClick(term)}
                    >
                      <span>🔍</span>
                      <span>{term}</span>
                    </button>

                    <button
                      type="button"
                      className="border-none bg-transparent text-text-muted px-3 py-2 cursor-pointer text-[0.8125rem] hover:text-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchHistoryItem(term);
                      }}
                      aria-label={`حذف ${term} من تاريخ البحث`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
