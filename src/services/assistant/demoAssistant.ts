// ─── مساعد قريتي (المساعد الذكي)
// Role-aware assistant. Today it answers from a curated Egyptian-Arabic
// knowledge base about using the app — no invented prices, no fake promises;
// when it doesn't know, it says so and points to support. The live AI
// (Groq, then Gemini) plugs in behind assistantLive.ts once the secure
// server-side key path is deployed (docs/proposals/ai-assistant.md): the key
// never ships in the app.
import { normalizeArabic } from '@/utils/arabicSearch';
import type { UserRole } from '@/types';
import { isStaffRole } from '@/config/staffTiers';

export type AssistantAudience = 'customer' | 'merchant';

export interface AssistantMessage {
  from: 'user' | 'assistant';
  text: string;
}

export interface QuickPrompt {
  id: string;
  label: string;
  question: string;
}

/** Customers see customer prompts; shop owners and professionals (staff
 * tiers) see prompts about their dashboard and products. */
export function assistantAudienceFor(role: UserRole | null | undefined): AssistantAudience {
  return isStaffRole(role) ? 'merchant' : 'customer';
}

export const ASSISTANT_NAME = 'مساعد قريتي';

const CUSTOMER_PROMPTS: QuickPrompt[] = [
  { id: 'order', label: 'أطلب إزاي؟', question: 'أطلب من محل إزاي؟' },
  { id: 'track', label: 'أتابع طلبي', question: 'أتابع طلبي منين؟' },
  { id: 'fees', label: 'رسوم التوصيل', question: 'رسوم التوصيل كام؟' },
  { id: 'points', label: 'النقاط', question: 'النقاط بتشتغل إزاي؟' },
  { id: 'provider', label: 'أحجز صنايعي', question: 'أحجز صنايعي أو مدرس إزاي؟' },
];

const MERCHANT_PROMPTS: QuickPrompt[] = [
  { id: 'add-product', label: 'أضيف منتج', question: 'أضيف منتج لمحلي إزاي؟' },
  { id: 'availability', label: 'أقفل منتج', question: 'منتج خلص، أقفله إزاي؟' },
  { id: 'hours', label: 'مواعيد المحل', question: 'أظبط مواعيد فتح وقفل المحل إزاي؟' },
  { id: 'orders', label: 'الطلبات الجديدة', question: 'الطلبات الجديدة بتظهرلي فين؟' },
  { id: 'photos', label: 'صور المنتجات', question: 'أضيف صورة لمنتج إزاي؟' },
];

export function quickPromptsFor(role: UserRole | null | undefined): QuickPrompt[] {
  return assistantAudienceFor(role) === 'merchant' ? MERCHANT_PROMPTS : CUSTOMER_PROMPTS;
}

interface Rule {
  keywords: string[];
  audience: AssistantAudience | 'any';
  answer: string;
}

// Every answer describes only what the app really does today. No invented
// prices, ETAs or phone numbers.
const RULES: Rule[] = [
  {
    keywords: ['اطلب', 'اطلب ازاي', 'طلب', 'اوردر'],
    audience: 'customer',
    answer:
      'من الرئيسية اختار المحل أو الخدمة، ضيف اللي محتاجه للسلة، وبعدين افتح السلة وكمّل الطلب. لازم تحدد مكانك على الخريطة قبل ما تبعت — ده بيساعد المندوب يوصلك صح. هتلاقي طلبك بعدها في صفحة «طلباتي».',
  },
  {
    keywords: ['تابع', 'فين طلبي', 'طلبي وصل', 'تتبع'],
    audience: 'customer',
    answer: 'افتح «طلباتي» من الشريط اللي تحت، هتلاقي كل طلباتك وحالة كل واحد: مستني، اتأكد، في الطريق، أو وصل.',
  },
  {
    keywords: ['رسوم', 'توصيل', 'الدليفري', 'عمولة'],
    audience: 'any',
    answer: 'رسوم التوصيل بتظهرلك واضحة في السلة قبل ما تبعت الطلب، ومفيش رسوم مخفية. أول طلب ليك عليه رسوم بس زيادة بسيطة.',
  },
  {
    keywords: ['نقاط', 'نقط', 'مكافا'],
    audience: 'customer',
    answer: 'النقاط لسه مفعلتش بشكل كامل، فمتعتمدش على رصيدها دلوقتي. أول ما تتفعل رسمي هنعلنها جوه التطبيق.',
  },
  {
    keywords: ['صنايعي', 'مدرس', 'دكتور', 'جليسه', 'نضافه', 'احجز'],
    audience: 'customer',
    answer: 'من الرئيسية نزّل لقسم «احجز حد بالاسم» واختار القسم: مدرسين، دكاترة وتمريض، نظافة، جليسات. تقدر تدور بالاسم أو التخصص، وتبعت طلب الحجز من صفحة الشخص.',
  },
  {
    keywords: ['اضيف منتج', 'منتج جديد', 'اضيف صنف'],
    audience: 'merchant',
    answer: 'من لوحة التحكم بتاعتك افتح تبويب المنتجات واضغط «إضافة منتج»: اكتب الاسم والسعر والوحدة، وارفع صورة للمنتج. المنتج المضاف بيظهر للعملاء لما يكون متاح وله صورة.',
  },
  {
    keywords: ['اقفل منتج', 'منتج خلص', 'اتاحه', 'متوفر', 'خلصان'],
    audience: 'merchant',
    answer: 'من لوحة التحكم > المنتجات، جنب كل منتج مفتاح الإتاحة: قفله لما المنتج يخلص ورجّعه لما يتوفّر. المنتج المقفول بيفضل ظاهر بشارة «خلصان» بدل ما يختفي.',
  },
  {
    keywords: ['سعر', 'غير سعر', 'عدل سعر'],
    audience: 'merchant',
    answer: 'من لوحة التحكم > المنتجات دوس على السعر وعدّله، والتعديل بيتحفظ ويوصل للعملاء.',
  },
  {
    keywords: ['مواعيد', 'افتح', 'اقفل', 'مشغول', 'بيزنس'],
    audience: 'merchant',
    answer: 'من لوحة التحكم تقدر تعمل «استراحة» مؤقتة فتظهر للعملاء مشغول، وتظبط مواعيد الفتح والقفل من بيانات المحل.',
  },
  {
    keywords: ['طلبات جديده', 'طلباتي', 'طلب جديد'],
    audience: 'merchant',
    answer: 'الطلبات الجديدة بتظهر في لوحة التحكم > تبويب الطلبات. خلي الصفحة مفتوحة وهتلاقي الطلب بيوصلك أول بأول.',
  },
  {
    keywords: ['صوره', 'صور', 'فوتو'],
    audience: 'merchant',
    answer: 'من لوحة التحكم > المنتجات، دوس على صورة المنتج وارفع صورة من موبايلك. الصورة الواضحة بتفرق جدًا في الطلبات.',
  },
  {
    keywords: ['حساب', 'اسجل', 'ادخل', 'جوجل'],
    audience: 'any',
    answer: 'تقدر تعمل حساب بالإيميل وكلمة السر من «اعمل حساب جديد»، أو تدخل بجوجل. أول مرة تدخل بجوجل هنطلب منك اسم مستخدم ورقم موبايل عشان الطلبات.',
  },
  {
    keywords: ['مندوب', 'دليفري', 'اشغل'],
    audience: 'any',
    answer: 'لو حابب تشتغل مندوب أو تضيف محلك أو خدمتك، كلمنا من صفحة «حسابي» أو من قسم الوظائف، وفريق قريتي هيرد عليك.',
  },
];

export const FALLBACK_REPLY =
  'سؤالك مش عندي إجابته لسه. جرّب تسأل عن الطلبات أو التوصيل أو المنتجات، أو كلم الدعم من صفحة «حسابي» وهنرد عليك.';

export function demoReply(question: string, role: UserRole | null | undefined): string {
  const audience = assistantAudienceFor(role);
  const q = normalizeArabic(question);
  for (const rule of RULES) {
    if (rule.audience !== 'any' && rule.audience !== audience) continue;
    if (rule.keywords.some((k) => q.includes(normalizeArabic(k)))) return rule.answer;
  }
  return FALLBACK_REPLY;
}

/** The greeting the chat opens with, per audience. */
export function greetingFor(role: UserRole | null | undefined): string {
  return assistantAudienceFor(role) === 'merchant'
    ? 'أهلًا بيك! أنا مساعد قريتي. اسألني عن لوحة التحكم: إضافة منتج، إتاحة، مواعيد، طلبات، صور.'
    : 'أهلًا بيك! أنا مساعد قريتي. اسألني عن الطلب والتوصيل والحجز، وأنا هرد عليك بالمصري.';
}
