// ─── Imports
import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useCartStore } from '@/stores/useCartStore';
import type { ActiveTab } from '@/types';

// ─── Component
export function Header() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const searchHistory = useUIStore((state) => state.searchHistory);
  const addSearchHistory = useUIStore((state) => state.addSearchHistory);
  const removeSearchHistoryItem = useUIStore(
    (state) => state.removeSearchHistoryItem
  );

  const notifications = useUIStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const setIsNotificationsOpen = useUIStore(
    (state) => state.setIsNotificationsOpen
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const navLinks: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'orders', label: 'طلباتي', icon: '📋' },
    { id: 'favorites', label: 'المفضلة', icon: '❤️' },
    { id: 'messages', label: 'الرسائل', icon: '💬' },
    { id: 'profile', label: 'حسابي', icon: '👤' },
  ];

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Top Section */}
        <div className="header-top">
          {/* Brand Logo & Village Name */}
          <div
            className="header-brand"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('home')}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-icon" role="img" aria-label="أيقونة قريتي">
              🏡
            </div>
            <div className="brand-text">
              <h1>قريتي</h1>
              <span>📍 قرية البركة - الجيزة</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" aria-label="التنقل الرئيسي">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`desktop-nav-link ${
                  activeTab === link.id ? 'active' : ''
                }`}
                onClick={() => setActiveTab(link.id)}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Action Buttons: Notifications & Cart */}
          <div className="header-actions">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label={`الإشعارات (${unreadCount} غير مقروءة)`}
            >
              <span role="img" aria-hidden="true">
                🔔
              </span>
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            <button
              type="button"
              className={`btn-icon ${cartWiggle ? 'wiggle-animation' : ''}`}
              onClick={() => setIsCartOpen(true)}
              aria-label={`سلة المشتريات (${totalCartCount} عناصر)`}
            >
              <span role="img" aria-hidden="true">
                🛒
              </span>
              {totalCartCount > 0 && (
                <span className="badge">{totalCartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar with History Dropdown */}
        <div className="search-bar" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="search-inner">
            <span role="img" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              placeholder="دور على خدمة أو محل (مثل: عيش، سباك، شوي سمك)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              aria-label="البحث عن خدمة أو محل"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="مسح البحث"
              >
                ✕
              </button>
            )}
          </form>

          {/* Search History Suggestions Dropdown */}
          {isSearchFocused && searchHistory.length > 0 && (
            <div className="search-suggestions-dropdown">
              <div className="suggestions-header">
                <span>🕒 آخر عمليات البحث</span>
              </div>
              <ul className="suggestions-list">
                {searchHistory.map((term, index) => (
                  <li key={index} className="suggestion-item">
                    <button
                      type="button"
                      className="suggestion-btn"
                      onClick={() => handleSuggestionClick(term)}
                    >
                      <span className="suggestion-icon">🔍</span>
                      <span className="suggestion-text">{term}</span>
                    </button>
                    <button
                      type="button"
                      className="suggestion-remove-btn"
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
