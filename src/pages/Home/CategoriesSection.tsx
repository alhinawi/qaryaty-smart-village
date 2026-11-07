import { Link } from 'react-router';
import { ROUTES } from '@/routes';
import type { CategoryFilter, CategoryItem } from '@/types';

const photos: Record<string, string> = Object.fromEntries(['all','food','restaurants','delivery','craft','edu','health','care','home','finishing','donate'].map(id => [id, `/img/home-refresh/category-${id}.webp`]));
interface CategoriesSectionProps {
  categories: CategoryItem[];
  selectedCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
}
export function CategoriesSection({ categories, selectedCategory, onSelectCategory }: CategoriesSectionProps) {
  return (
    <section className="mb-5" aria-label="فئات الخدمات">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold text-green-dark">يومك أسهل مع قريتي</h2>
        <button type="button" className="text-xs text-green font-bold" onClick={() => onSelectCategory('all')}>كل الخدمات</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" id="catScroll">
        {categories.map(category => (
          <button key={category.id} type="button" aria-pressed={selectedCategory === category.id} onClick={() => onSelectCategory(category.id)} className="w-[82px] shrink-0 group">
            <div className={`aspect-square rounded-[20px] overflow-hidden border-2 transition-all ${selectedCategory === category.id ? 'border-green shadow-sm' : 'border-transparent bg-stone-100'}`}>
              <img src={photos[category.id]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <span className={`block text-[11px] leading-5 mt-1.5 font-bold ${selectedCategory === category.id ? 'text-green' : 'text-text'}`}>{category.label}</span>
          </button>
        ))}
        <Link to={ROUTES.donate} className="w-[82px] shrink-0 text-center text-[11px] font-bold text-text">
          <img src={photos.donate} alt="" className="w-full aspect-square rounded-[20px] object-cover border-2 border-transparent" />
          <span className="block mt-1.5 leading-5">باب الخير</span>
        </Link>
      </div>
    </section>
  );
}
