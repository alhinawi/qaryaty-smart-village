// ─── Constants

/** Shown in the footer as the app's developer */
export const DEVELOPER_NAME = 'Mohamed Alhinawi';

// ─── Component

/** Desktop-only footer (lg, 1024px and up). Phones and tablets have the bottom nav instead. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="hidden lg:block w-full bg-linear-to-br from-green-dark to-green text-white mt-auto"
      aria-label="تذييل الصفحة"
    >
      <div className="w-[min(100%-3rem,1200px)] mx-auto py-5 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 select-none">
          <div
            className="w-[38px] h-[38px] bg-gold rounded-xl flex items-center justify-center text-[20px] shrink-0"
            aria-hidden="true"
          >
            🏡
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black font-['Tajawal',sans-serif] leading-tight">قريتي</span>
            <span className="text-xs text-white/75">خدمات قريتك كلها في مكان واحد</span>
          </div>
        </div>

        {/* Developer */}
        <p className="text-sm text-white/90">
          تطوير وتصميم{' '}
          <span className="font-extrabold text-gold-light" dir="auto">
            {DEVELOPER_NAME}
          </span>
        </p>

        {/* Copyright */}
        <p className="text-xs text-white/70" dir="rtl">
          © {year} قريتي. كل الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
