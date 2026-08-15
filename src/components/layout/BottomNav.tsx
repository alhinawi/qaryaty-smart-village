// ─── Imports
import { useUIStore } from '@/stores/useUIStore';
import type { ActiveTab, OrderModalData } from '@/types';

// ─── Types
interface BottomNavProps {
  onOpenQuickOrder: (data: OrderModalData) => void;
}

// ─── Component
export function BottomNav({ onOpenQuickOrder }: BottomNavProps) {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const handleFabClick = () => {
    onOpenQuickOrder({
      emoji: '🚀',
      name: 'اطلب خدمة سريعة',
      desc: 'اكتب اللي محتاجه وهنوصلهولك فوراً داخل القرية',
    });
  };

  const navItems: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'orders', label: 'طلباتي', icon: '📋' },
    { id: 'favorites', label: 'المفضلة', icon: '❤️' },
    { id: 'profile', label: 'حسابي', icon: '👤' },
  ];

  return (
    <nav className="bottom-nav" aria-label="شريط التنقل السفلي">
      {/* Home & Orders */}
      {navItems.slice(0, 2).map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
          aria-label={item.label}
        >
          <span className="nav-icon" role="img" aria-hidden="true">
            {item.icon}
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}

      {/* Central Floating Action Button (FAB) */}
      <button
        type="button"
        className="nav-item nav-fab-wrapper"
        onClick={handleFabClick}
        aria-label="طلب خدمة سريعة"
      >
        <div className="nav-fab" aria-hidden="true">
          +
        </div>
      </button>

      {/* Favorites & Profile */}
      {navItems.slice(2, 4).map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
          aria-label={item.label}
        >
          <span className="nav-icon" role="img" aria-hidden="true">
            {item.icon}
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
