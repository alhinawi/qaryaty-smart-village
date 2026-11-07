// ─── "الخدمة متوقفة مؤقتًا" banner
// Shown when Supabase failed or is paused: the app keeps working on sample
// data, and orders / login are refused with a clear message until it is back.
import { useState } from 'react';
import { retryBackend, useBackendStatus } from '@/repositories';
import { useCatalogStore } from '@/stores/useCatalogStore';

export function ServiceStatusBanner() {
  const mode = useBackendStatus((state) => state.mode);
  const reloadCatalog = useCatalogStore((state) => state.load);
  const [retrying, setRetrying] = useState(false);

  if (mode !== 'degraded') return null;

  const handleRetry = async () => {
    setRetrying(true);
    retryBackend();
    await reloadCatalog(true);
    setRetrying(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-[#fff7e6] border-b border-[#f0a500]/40 text-[#7a4b00] px-4 py-2.5"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-3 text-[13px] leading-relaxed">
        <span aria-hidden="true">⚠️</span>
        <p className="flex-1 m-0">
          <strong className="font-extrabold">الخدمة متوقفة مؤقتًا.</strong> تقدر تتصفح الخدمات، لكن الطلبات
          وتسجيل الدخول مش هيشتغلوا لحد ما ترجع.
        </p>
        <button
          type="button"
          onClick={() => void handleRetry()}
          disabled={retrying}
          className="shrink-0 bg-white border border-[#f0a500]/60 rounded-lg px-3 py-1 text-xs font-extrabold text-[#7a4b00] disabled:opacity-60"
        >
          {retrying ? 'بنجرّب...' : 'جرّب تاني'}
        </button>
      </div>
    </div>
  );
}
