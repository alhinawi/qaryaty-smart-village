// ─── Imports
import type { CategoryItem } from '@/types';

// ─── Constants
export const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'الكل', emoji: '🏠' },
  { id: 'food', label: 'أكل وشرب', emoji: '🍞' },
  { id: 'restaurants', label: 'مطاعم', emoji: '🍽️' },
  { id: 'delivery', label: 'توصيل', emoji: '🛵' },
  { id: 'craft', label: 'حرف', emoji: '🔨' },
  { id: 'edu', label: 'مدرسين', emoji: '👩‍🏫' },
  { id: 'health', label: 'صحة', emoji: '🩺' },
  { id: 'care', label: 'رعاية أطفال وكبار السن', emoji: '🍼' },
  { id: 'home', label: 'خدمات البيت', emoji: '🧹' },
  { id: 'finishing', label: 'عمال التشطيب', emoji: '🧱' },
];
