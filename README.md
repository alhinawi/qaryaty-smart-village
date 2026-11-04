# 🏡 قريتي - تطبيق القرية الذكية (Qaryati - Smart Village)

> **خدمات القرية الذكية في جيبك** — تطبيق ويب متطور وسريع مبني بأحدث تقنيات React 19 وTypeScript وVite وZustand لإتاحة كافة خدمات ومحلات أهالي القرية بسهولة وسرعة.

---

## 📖 نظرة عامة (Overview)

**قريتي** هو تطبيق ويب تجاوبي بالكامل (Mobile-First & Fully Responsive) موجه لأهالي القرى، يتيح طلب الخدمات اليومية (مخبز، خضار وفواكه، شوي سمك، سوبرماركت، حرفيين، توصيل مدارس، أكل بيتي) مع تتبع فوري للطلبات، وسلة مشتريات ذكية، ونظام مكافآت ونقاط، وتقييمات حقيقية للمزودين.

### ✨ المميزات الرئيسية (Key Features)

1. **تصميم Mobile-First وتجاوبي شامل (Responsive Design):**
   - متوافق من أصغر شاشات الموبايل (320px, 360px, 390px, 430px) وحتى الشاشات الكبيرة (768px, 1024px, 1280px, 1440px+).
2. **إدارة الحالة باستخدام Zustand (State Management):**
   - `useCartStore`: إدارة سلة التسوق، حساب الإجمالي، وتأثير الهزّة التفاعلي (Wiggle animation).
   - `useOrderStore`: تتبع مراحل الطلب (استلام، تجهيز، في الطريق، تم التسليم) وتقييم الخدمات.
   - `useUserStore`: بيانات الحساب، نظام المفضلة، ونقاط المكافآت.
   - `useUIStore`: التبويبات النشطة، الإشعارات الفورية، وسجل البحث المحفوظ.
3. **التحقق من البيانات بواسطة Zod (Validation):**
   - التحقق الصارم من أرقام الموبايل المصرية وعناوين القرية وصحة أكواد الخصم.
4. **دعم PWA والعمل بدون إنترنت (Progressive Web App):**
   - إمكانية التثبيت كتطبيق مستقل على أجهزة الموبايل مع Service Worker.
5. **نظام تقييم ومكافآت (Ratings & Reward Points):**
   - تقييم 5 نجوم بعد إتمام الطلب مع كسب نقاط مكافآت لاستبدالها بتوصيل مجاني.
6. **سجل بحث وتفضيلات محفوظة (localStorage Persistence):**
   - حفظ آخر 5 عمليات بحث واقتراحها تلقائياً.
7. **كود الخصم الترويجي:**
   - استخدام كود `QARYA1` للحصول على خصم 100% على أول طلب.

---

## 🛠️ متطلبات التشغيل (Prerequisites)

- **Node.js**: إصدار `v18+` (يوصى بـ `v20` أو `v22`).
- **pnpm**: إصدار `v10` (المشروع مثبّت على `pnpm@10.34.9` في `packageManager` داخل `package.json`).
  - ‏pnpm 9 بيفشل مع `pnpm-workspace.yaml` (إعداد `allowBuilds`).
  - أسهل طريقة: `corepack enable` وبعدها `pnpm` هيستخدم الإصدار الصح تلقائياً.

---

## 🚀 خطوات التثبيت والتشغيل (Getting Started)

### 1. تثبيت الحزم (Install Dependencies)
```bash
pnpm install
```

### 2. تشغيل السيرفر المحلي (Run Development Server)
```bash
pnpm run dev
```
سيعمل التطبيق على المنفذ الافتراضي: `http://localhost:5173/`

### 3. بناء نسخة الإنتاج (Production Build)
```bash
pnpm run build
```

### 4. معاينة نسخة الإنتاج (Preview)
```bash
pnpm run preview
```

---

## 🗄️ البيانات و Supabase

الصفحات مابتكلمش Supabase ولا البيانات التجريبية مباشرة. كل حاجة بتعدي من طبقة `src/repositories`:

- `getServices()` و `getShops()` و `getProviders()` للكتالوج، و `createOrder()` للطلبات، و `authRepo` للدخول والتسجيل.
- كل repository ليه نسختين بنفس الواجهة: `mock` (بيانات تجريبية في المتصفح) و `supabase` (الباك إند الحقيقي)، والاختيار بيحصل مرة واحدة في `src/repositories/index.ts`.

**التشغيل بدون Supabase (الوضع التجريبي):** سيب المتغيرات فاضية، والتطبيق يشتغل على البيانات التجريبية زي ما هو.

**التشغيل مع Supabase:**
1. انسخ `.env.example` لـ `.env.local` وحط `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`.
2. شغّل `supabase/schema.sql` في SQL Editor، وبعده `supabase/seed.sql` (بيتعمل من `src/data` بالأمر `pnpm seed:sql`).
3. من Authentication ← Providers ← Email اقفل **Confirm email** (الدخول بالموبايل وكلمة السر بيستخدم إيميل داخلي).

**الأمان (المفتاح اللي في التطبيق مفتاح عام):**
- RLS شغال على كل الجداول، والصلاحيات بتبدأ من الصفر ونرجّع اللي التطبيق محتاجه بس.
- الخدمات والمحلات والمقدّمين: أي حد يقرا، والأدمن بس اللي يعدّل.
- `profiles`: كل واحد يشوف صفّه بس، ويعدّل الاسم والقرية والعنوان بس. الدور والحظر والموبايل (وأي عمود يتضاف بعدين زي رصيد) مايتعدلوش من التطبيق. الأدمن بيغيّر الدور والحظر من `admin_set_role` و `admin_set_blocked`.
- `orders`: أي حد يطلب باسمه بس، والحالة بتبدأ `pending` دايمًا، والأدمن بس اللي يغيّر الحالة.
- مفيش رصيد في قاعدة البيانات. نقاط المكافآت متخزنة على الموبايل بس. لو اتعمل رصيد بعدين، يتغيّر من function على السيرفر بس.

**لو Supabase وقع أو المشروع اتعمله Pause:**
- القراءة (الخدمات والمحلات والمدرسين) بترجع البيانات التجريبية، ويظهر شريط "الخدمة متوقفة مؤقتًا" فيه زرار "جرّب تاني".
- الكتابة (الطلبات، الدخول، التسجيل) **مابتتحفظش على البيانات التجريبية**: بتفشل برسالة واضحة، والفورم بيفضل زي ما هو.
- Circuit breaker: بعد 3 أخطاء ورا بعض التطبيق بيبطل يكلم Supabase لمدة 30 ثانية، وبعدها يجرب طلب واحد.

---

## 📁 هيكل المشروع (Project Structure)

```text
qaryati-smart-village/
├── public/                 # الملفات الثابتة والأيقونات
├── src/
│   ├── assets/             # الصور والأيقونات
│   ├── components/
│   │   ├── layout/         # Header, BottomNav, PageWrapper, SplashScreen, Drawers
│   │   ├── shared/         # ServiceCard, ShopCard, CategoryChip, RatingModal
│   │   └── ui/             # Button, Input, Modal, Badge, Skeleton, EmptyState, Toast
│   ├── data/               # services.ts, shops.ts, categories.ts, features.ts
│   ├── hooks/              # useLocalStorage, useModal, useCart, useOrders, useSplashScreen
│   ├── repositories/       # طبقة البيانات: catalog / orders / auth (mock + supabase)، fallback و circuit breaker
│   ├── pages/
│   │   ├── Home/           # الصفحة الرئيسية بكافة أقسامها
│   │   ├── Orders/         # صفحة سجل وتتبع الطلبات
│   │   ├── Favorites/      # صفحة الخدمات المفضلة
│   │   ├── Messages/       # صفحة المحادثات المباشرة
│   │   └── Profile/        # صفحة الحساب ونقاط المكافآت
│   ├── stores/             # Zustand Stores (useCartStore, useOrderStore, useUIStore, useUserStore)
│   ├── types/              # TypeScript Interfaces & Types
│   ├── utils/              # helpers.ts, theme.ts, validators.ts (Zod)
│   ├── App.tsx             # التطبيق الرئيسي وتوزيع التبويبات والصفحات
│   ├── main.tsx            # نقطة انطلاق التطبيق
│   └── index.css           # ملف التنسيقات الأساسي والتصميم التجاوبي
├── supabase/               # schema.sql (الجداول و RLS) و seed.sql (البيانات التجريبية)
├── scripts/                # make-seed.ts: بيعمل seed.sql من src/data
├── index.html              # ملف الـ HTML الأساسي مع وسوم الـ SEO
├── package.json            # تعريف الحزم والتبعيات
├── tsconfig.json           # إعدادات TypeScript الصارمة
└── vite.config.ts          # إعدادات Vite و PWA
```

---

## 📜 الترخيص (License)

هذا المشروع مخصص لأغراض التطوير والعرض لصالح مشروع **قريتي - القرية الذكية**.

# Qaryaty
