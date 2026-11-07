import { useState } from 'react';
import { ServicePickerModal } from '@/components/modals/ServicePickerModal';
// ─── Imports
import { useGoToTab, useActiveTab } from '@/hooks/useTabNavigation';
import type { ActiveTab, OrderModalData } from '@/types';

// ─── Types
interface BottomNavProps {
  onOpenQuickOrder: (data: OrderModalData) => void;
}

// ─── Component
export function BottomNav({ onOpenQuickOrder }: BottomNavProps) {
  const activeTab = useActiveTab();
  const setActiveTab = useGoToTab();

  const [pickerOpen, setPickerOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'orders', label: 'طلباتي', icon: '📋' },
    { id: 'favorites', label: 'المفضلة', icon: '❤️' },
    { id: 'profile', label: 'حسابي', icon: '👤' },
  ];

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 flex shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-100 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="شريط التنقل السفلي">
      {/* Home & Orders */}
      {navItems.slice(0, 2).map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 cursor-pointer transition-all duration-200 border-none bg-transparent font-['Cairo',sans-serif] ${isActive ? 'text-green' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
          >
            <span className="text-[22px] leading-none" role="img" aria-hidden="true">
              {item.icon}
            </span>
            <span className={`text-[11px] mt-0.5 ${isActive ? 'text-green font-extrabold' : 'text-text-muted font-bold'}`}>{item.label}</span>
          </button>
        );
      })}

      {/* Central Floating Action Button (FAB) */}
      <button
        type="button"
        className="flex-1 flex flex-col items-center justify-center py-2 px-1 cursor-pointer transition-all duration-200 border-none bg-transparent font-['Cairo',sans-serif] relative group"
        onClick={() => setPickerOpen(true)}
        aria-label="اختار خدمة"
      >
        <div className="w-[52px] h-[52px] bg-green rounded-2xl flex items-center justify-center text-[26px] text-white mt-[-24px] shadow-[0_8px_24px_rgba(26,122,74,0.5)] transition-all duration-200 group-hover:scale-110 group-hover:bg-green-light" aria-hidden="true">
          +
        </div>
      </button>

      {/* Favorites & Profile */}
      {navItems.slice(2, 4).map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 cursor-pointer transition-all duration-200 border-none bg-transparent font-['Cairo',sans-serif] ${isActive ? 'text-green' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
          >
            <span className="text-[22px] leading-none" role="img" aria-hidden="true">
              {item.icon}
            </span>
            <span className={`text-[11px] mt-0.5 ${isActive ? 'text-green font-extrabold' : 'text-text-muted font-bold'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
    {pickerOpen && <ServicePickerModal onClose={() => setPickerOpen(false)} onOpenOrder={onOpenQuickOrder} />}
    </>
  );
}
