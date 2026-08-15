// ─── Imports
import React from 'react';

// ─── Types
interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onShowToast: (message: string) => void;
}

// ─── Render
export function Header({
  searchQuery,
  onSearchChange,
  onShowToast,
}: HeaderProps) {
  const handleNotificationsClick = () => {
    onShowToast('🔔 مفيش إشعارات جديدة دلوقتي');
  };

  const handleCartClick = () => {
    onShowToast('🛒 سلتك فاضية! ابدأ اطلب');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <header>
      {/* Header Top Bar */}
      <div className="header-top">
        <div className="header-brand">
          <div className="brand-icon" role="img" aria-label="أيقونة قريتي">
            🏡
          </div>
          <div className="brand-text">
            <h1>قريتي</h1>
            <span>📍 قرية البركة - الجيزة</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={handleNotificationsClick}
            aria-label="الإشعارات (3 إشعارات غير مقروءة)"
          >
            <span role="img" aria-hidden="true">🔔</span>
            <span className="badge">3</span>
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={handleCartClick}
            aria-label="سلة المشتريات (فارغة)"
          >
            <span role="img" aria-hidden="true">🛒</span>
            <span className="badge">0</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-inner">
          <span role="img" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder="دور على خدمة أو محل..."
            value={searchQuery}
            onChange={handleInputChange}
            aria-label="البحث عن خدمة أو محل"
          />
        </div>
      </div>
    </header>
  );
}
