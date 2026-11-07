import { isTrackingDemoMode } from '@/config/demoMode';
export type OpinionKind = 'shop' | 'provider' | 'service' | 'product';
export interface DemoOpinion { id: string; author: string; stars: number; text: string }
const names = ['أحمد م.', 'منى ع.', 'محمود س.', 'هبة م.'];
const phrases: Record<OpinionKind, string[]> = {
 shop: ['الحاجات وصلت مترتبة والطلب كان كامل. هطلب منه تاني.', 'التعامل محترم، بس يا ريت يبلغونا بدري لو صنف مش موجود.', 'الأسعار كانت زي المكتوب، والتغليف كويس.', 'الطلب اتأخر شوية، لكن ردوا عليا ووضحوا السبب.'],
 provider: ['اتفقنا على المعاد وجيه في وقته. التعامل كان محترم.', 'الخدمة كويسة وشرحلي اللي هيتعمل قبل ما يبدأ.', 'النتيجة كويسة، بس تحديد المعاد محتاج يبقى أوضح.', 'سمع المطلوب واهتم بالتفاصيل. تجربة كويسة.'],
 service: ['طلبت الخدمة والخطوات كانت واضحة من الأول.', 'التعامل كويس والخدمة اتعملت زي ما اتفقنا.', 'المعاد اتأخر شوية، لكن كلموني قبلها.', 'السعر كان واضح ومفيش مصاريف زيادة ظهرت فجأة.'],
 product: ['الصنف وصل بحالة كويسة وزي الوصف.', 'الجودة كويسة بالنسبة للسعر، والتغليف كان سليم.', 'الصنف كويس، ياريت يتأكدوا من التغليف أكتر.', 'طلبته مع باقي الحاجات ووصل من غير نقص.'],
};
/** Fictional presentation data only. Never inserted into reviews or review aggregates. */
export function demoOpinions(kind: OpinionKind, target: string | number): DemoOpinion[] {
 if (!isTrackingDemoMode()) return [];
 const offset = [...String(target)].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
 return [0, 1, 2].map((i) => ({ id: `opinion_demo_${kind}_${target}_${i}`, author: names[(offset + i) % 4], stars: [5, 4, 4][i], text: phrases[kind][(offset + i) % 4] }));
}
