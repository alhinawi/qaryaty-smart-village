import type { Shop } from '@/types';

/** Fictional display-only stores. Never create merchant rows or claim live stock. */
export const ILLUSTRATIVE_SHOPS: Shop[] = [
  ...[
    ['عطارة الحاج محمود', 'منية سندوب'], ['عطارة أبو حسان', 'سندوب'],
    ['عطارة بركة البلد', 'نقيطة'], ['عطارة أولاد سالم', 'شاوة'],
    ['عطارة بيت التوابل', 'ميت خميس'], ['عطارة عم رجب', 'منية سندوب'],
    ['عطارة ريحان', 'سندوب'], ['عطارة كنوز البلد', 'نقيطة'],
  ].map(([name, village], i): Shop => ({
    id: -901 - i, name, village, kind: 'attar', emoji: '🌿',
    description: 'توابل وأعشاب ومكسرات وياميش. محل خيالي للعرض فقط، وليس مخزونًا متاحًا للطلب.',
    demo: true, open: true, time: 'للعرض فقط', bgColor: '#F3F7E9',
    photo: `/img/illustrative-shops/attar-${i + 1}.webp`,
  })),
  ...[
    ['مكتبة النجاح', 'منية سندوب'], ['مكتبة أولاد حسن', 'سندوب'],
    ['مكتبة القلم', 'نقيطة'], ['مكتبة الحاج إبراهيم', 'شاوة'],
    ['مكتبة جيل بكرة', 'ميت خميس'], ['مكتبة ركن الطالب', 'منية سندوب'],
    ['مكتبة الفجر', 'سندوب'], ['مكتبة أهل البلد', 'نقيطة'],
  ].map(([name, village], i): Shop => ({
    id: -1001 - i, name, village, kind: 'stationery', emoji: '📚',
    description: 'أدوات مدرسية وكراريس وكتب وطباعة وتصوير. محل خيالي للعرض فقط، وليس مخزونًا متاحًا للطلب.',
    demo: true, open: true, time: 'للعرض فقط', bgColor: '#EEF2FF',
    photo: `/img/illustrative-shops/stationery-${i + 1}.webp`,
  })),
];

export function appendIllustrativeShops(shops: Shop[]): Shop[] {
  return [...shops, ...ILLUSTRATIVE_SHOPS.filter(example => !shops.some(shop => shop.id === example.id))];
}
