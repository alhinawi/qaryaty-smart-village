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
      className={`cat-chip${isActive ? ' active' : ''}`}
      onClick={() => onSelect(category.id)}
      aria-pressed={isActive}
      aria-label={`تصفية فئة: ${category.label}`}
    >
      <div className="cat-icon">
        <span role="img" aria-hidden="true">
          {category.emoji}
        </span>
      </div>
      <div className="cat-label">{category.label}</div>
    </button>
  );
});
