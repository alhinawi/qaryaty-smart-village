// ─── Imports
import React from 'react';
import type { CategoryFilter, CategoryItem } from '@/types';
import { CategoryChip } from './CategoryChip';

// ─── Types
interface CategoriesProps {
  categories: CategoryItem[];
  selectedCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
}

// ─── Render
export function Categories({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoriesProps) {
  const handleAllClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onSelectCategory('all');
  };

  return (
    <section aria-label="فئات الخدمات">
      {/* Section Header */}
      <div className="section-header">
        <h3>
          <span role="img" aria-hidden="true">🗂️</span>
          {' '}الفئات
        </h3>
        <a href="#all" onClick={handleAllClick}>
          كل الفئات
        </a>
      </div>

      {/* Horizontal Scroll Chips */}
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
