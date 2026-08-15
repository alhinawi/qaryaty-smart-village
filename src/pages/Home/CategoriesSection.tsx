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
    <section className="categories-section" aria-label="فئات الخدمات">
      <div className="section-header">
        <h3>
          <span role="img" aria-hidden="true">
            🗂️
          </span>{' '}
          الفئات
        </h3>
        <a href="#all" onClick={handleAllClick}>
          عرض الكل
        </a>
      </div>

      <div className="categories-scroll" id="catScroll">
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
