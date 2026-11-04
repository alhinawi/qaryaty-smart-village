// ─── Imports
import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/routes';
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
        {/* باب الخير has its own page, so this one opens it instead of filtering */}
        <Link
          to={ROUTES.donate}
          className="flex flex-col items-center gap-[0.4rem] shrink-0 transition-transform duration-200 hover:translate-y-[-3px]"
        >
          <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-[28px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-2 bg-gold-light border-gold">
            <span aria-hidden="true">🤲</span>
          </div>
          <div className="text-[0.8125rem] text-center whitespace-nowrap text-text-muted font-bold">باب الخير</div>
        </Link>
      </div>
    </section>
  );
}
