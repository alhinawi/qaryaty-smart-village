// ─── Imports
import React from 'react';
import type { CategoryFilter, CategoryItem } from '@/types';
import { CategoryChip } from '@/components/shared/CategoryChip';

// ─── Types
interface CategoriesSectionProps {
  categories: CategoryItem[];
  selectedCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
}

// ─── Component
export function CategoriesSection({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoriesSectionProps) {
  const handleAllClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onSelectCategory('all');
  };

  return (
    <section className="mb-6" aria-label="فئات الخدمات">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-[clamp(1.0625rem,2.5vw,1.25rem)] font-extrabold text-green-dark flex items-center gap-2">
          <span role="img" aria-hidden="true">
            🗂️
          </span>{' '}
          الفئات
        </h3>
        <a href="#all" onClick={handleAllClick} className="text-sm text-green-light no-underline font-bold hover:underline">
          عرض الكل
        </a>
      </div>

      <div className="flex gap-3 pt-1 pb-1 overflow-x-auto overscroll-x-contain scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-x-visible" id="catScroll">
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            category={category}
            isActive={selectedCategory === category.id}
            onSelect={onSelectCategory}
          />
        ))}
      </div>
    </section>
  );
}
