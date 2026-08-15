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
- **pnpm**: إصدار `v9+` أو `v11+`.

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
├── index.html              # ملف الـ HTML الأساسي مع وسوم الـ SEO
├── package.json            # تعريف الحزم والتبعيات
├── tsconfig.json           # إعدادات TypeScript الصارمة
└── vite.config.ts          # إعدادات Vite و PWA
```

---

## 📜 الترخيص (License)

هذا المشروع مخصص لأغراض التطوير والعرض لصالح مشروع **قريتي - القرية الذكية**.
