// ─── Imports
import React from 'react';
import type { CategoryItem } from '@/types';

// ─── Types
interface CategoryChipProps {
  category: CategoryItem;
  isActive: boolean;
  onSelect: (id: CategoryItem['id']) => void;
}

// ─── Component
export const CategoryChip = React.memo(function CategoryChip({
  category,
  isActive,
  onSelect,
}: CategoryChipProps) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center gap-[0.4rem] cursor-pointer transition-transform duration-200 shrink-0 bg-transparent border-none font-['Cairo',sans-serif] p-0  hover:translate-y-[-3px]    group `}
      onClick={() => onSelect(category.id)}
      aria-pressed={isActive}
      aria-label={`تصفية فئة: ${category.label}`}
    >
      <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-[28px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 border-2 ${isActive ? 'bg-green border-green brightness-120' : 'bg-white border-[rgba(26,122,74,0.12)]'}`}>
        <span role="img" aria-hidden="true"  >
          {category.emoji}
        </span>
      </div>
      <div className={`text-[0.8125rem] text-center whitespace-nowrap ${isActive ? 'text-green-dark font-extrabold' : 'text-text-muted font-bold'}`}>{category.label}</div>
    </button>
  );
});
