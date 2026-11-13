// ─── Dashboard helpers (non-components, so the tab files keep fast refresh)
import { useCallback, useEffect, useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { adminRepo } from '@/repositories';

export { primaryBtn, outlineBtn, dangerBtn } from '@/pages/Jobs/jobUi';

export const smallBtn =
  "inline-flex items-center justify-center gap-1 min-h-[40px] px-3 rounded-lg bg-white text-green-dark border border-green/40 font-bold text-[13px] cursor-pointer font-['Cairo',sans-serif] disabled:opacity-50";
export const inputCls =
  "w-full min-h-[44px] px-3 rounded-xl border border-black/15 bg-white text-[15px] font-['Cairo',sans-serif] focus:outline-none focus:border-green";
export const labelCls = 'block text-[13px] font-bold text-text mb-1';

/** Loads on mount, again when `deps` change and on `reload()`; keeps the old data while reloading. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [nonce, setNonce] = useState(0);
  const want = `${JSON.stringify(deps)}#${nonce}`;
  const [result, setResult] = useState<{ data: T | null; error: string; for: string }>({
    data: null,
    error: '',
    for: '',
  });
  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setResult({ data, error: '', for: want }))
      .catch(
        (e) =>
          alive &&
          setResult((r) => ({ data: r.data, error: e instanceof Error ? e.message : 'حصلت مشكلة', for: want })),
      );
    return () => {
      alive = false;
    };
    // `want` already carries the deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want]);
  const setData = useCallback(
    (next: T | null | ((old: T | null) => T | null)) =>
      setResult((r) => ({
        ...r,
        data: typeof next === 'function' ? (next as (old: T | null) => T | null)(r.data) : next,
      })),
    [],
  );
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const loading = result.for !== want;
  return { data: result.data, setData, error: loading ? '' : result.error, loading, reload };
}

/** Runs an action, shows a toast for success or the error, returns whether it worked. */
export function useAction() {
  const showToast = useUIStore((s) => s.showToast);
  const [busy, setBusy] = useState('');
  const run = async (key: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(key);
    try {
      await fn();
      if (success) showToast(success);
      return true;
    } catch (e) {
      showToast(`⚠️ ${e instanceof Error ? e.message : 'حصلت مشكلة'}`);
      return false;
    } finally {
      setBusy('');
    }
  };
  return { busy, run };
}

/** The default delivery fee (app_settings), shared by the shops list and the fee card. */
export function useDefaultDeliveryFee() {
  return useLoad(() => adminRepo.getDefaultDeliveryFee(), []);
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      timeZone: 'Africa/Cairo',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}
