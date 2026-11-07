import { canDeleteAddress, LAST_ADDRESS_MESSAGE } from '@/utils/addressDeletion';
// ─── حسابي ← عناويني: list, add, edit, delete, set the default
import { useEffect, useState } from 'react';
import type { UserAddress } from '@/types';
import { useAddressStore } from '@/stores/useAddressStore';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { useReach } from '@/hooks/useReach';
import { formatAddress, googleMapsUrl, labelEmoji } from '@/utils/address';
import LocationPicker from './LocationPicker';

export default function MyAddresses() {
  const { addresses, loading, error, load, save, remove, setDefault } = useAddressStore();
  const user = useAuthStore(selectUser);
  const showToast = useUIStore((s) => s.showToast);
  const { village } = useReach();
  const [editing, setEditing] = useState<UserAddress | 'new' | null>(null);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    void load();
  }, [load, user?.id]);

  const handleDelete = async (a: UserAddress) => {
    if (!canDeleteAddress(addresses, a.id)) { showToast(LAST_ADDRESS_MESSAGE); return; }
    const ok = await confirmDelete(a);
    if (!ok) return;
    setBusyId(a.id);
    try {
      await remove(a.id);
      showToast('🗑️ العنوان اتمسح');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ماعرفناش نمسح العنوان');
    } finally {
      setBusyId('');
    }
  };

  const handleDefault = async (a: UserAddress) => {
    setBusyId(a.id);
    try {
      await setDefault(a.id);
      showToast(`⭐ «${a.label}» بقى العنوان الأساسي`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'حصلت مشكلة، جرّب تاني');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-5" id="my-addresses">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base font-extrabold">📍 عناويني</h3>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="bg-transparent border-none text-green font-extrabold cursor-pointer text-[13px]"
        >
          + عنوان جديد
        </button>
      </div>

      {!user && (
        <p className="text-[12px] text-text-muted mb-3 bg-cream rounded-xl p-2.5">
          العناوين محفوظة على الموبايل ده بس. سجّل دخول علشان تلاقيها لو دخلت من جهاز تاني.
        </p>
      )}

      {loading && addresses.length === 0 && (
        <div className="flex flex-col gap-2" aria-busy="true">
          <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-16 rounded-xl bg-gray-50 animate-pulse" />
        </div>
      )}

      {error && (
        <div className="text-sm text-danger mb-2 flex items-center gap-2" role="alert">
          <span className="flex-1">{error}</span>
          <button type="button" className="font-bold text-green" onClick={() => void load(true)}>
            جرّب تاني
          </button>
        </div>
      )}

      {!loading && !error && addresses.length === 0 && (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="w-full border-2 border-dashed border-green/40 rounded-2xl p-5 text-center active:scale-[0.99] transition"
        >
          <span className="block text-3xl mb-1">🗺️</span>
          <span className="block font-bold text-green-dark">حدّد بيتك على الخريطة</span>
          <span className="block text-xs text-text-muted mt-1">مرة واحدة، وبعد كده هتختاره في أي طلب</span>
        </button>
      )}

      {addresses.length === 1 && <p className="text-xs text-text-muted leading-relaxed mb-3">{LAST_ADDRESS_MESSAGE}</p>}
      <ul className="flex flex-col gap-2.5">
        {addresses.map((a) => (
          <li
            key={a.id}
            className={`rounded-2xl border-2 p-3 ${a.isDefault ? 'border-green/50 bg-green/5' : 'border-gray-100'}`}
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 rounded-full bg-white shadow-sm grid place-items-center text-xl" aria-hidden="true">
                {labelEmoji(a.label)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm flex items-center gap-2 flex-wrap">
                  {a.label}
                  {a.isDefault && (
                    <span className="text-[10px] font-bold text-white bg-green rounded-full px-2 py-0.5">الأساسي</span>
                  )}
                </p>
                <p className="text-[13px] text-text-muted leading-relaxed break-words">{formatAddress(a) || 'محدد على الخريطة'}</p>
                {a.phone && (
                  <p className="text-[12px] text-text-muted" dir="ltr" style={{ textAlign: 'right' }}>
                    {a.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5 text-[12px] font-bold">
              <button type="button" className="px-3 py-1.5 rounded-full bg-cream text-green-dark" onClick={() => setEditing(a)}>
                ✏️ تعديل
              </button>
              {!a.isDefault && (
                <button
                  type="button"
                  disabled={busyId === a.id}
                  className="px-3 py-1.5 rounded-full bg-cream text-green-dark disabled:opacity-50"
                  onClick={() => void handleDefault(a)}
                >
                  ⭐ خلّيه الأساسي
                </button>
              )}
              <a
                href={googleMapsUrl(a)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-cream text-green-dark no-underline"
              >
                🗺️ الخريطة
              </a>
              <button
                type="button"
                disabled={busyId === a.id || !canDeleteAddress(addresses, a.id)}
                className="px-3 py-1.5 rounded-full bg-red-50 text-danger disabled:opacity-50 ms-auto"
                onClick={() => void handleDelete(a)}
                aria-disabled={!canDeleteAddress(addresses, a.id)}
                title={!canDeleteAddress(addresses, a.id) ? LAST_ADDRESS_MESSAGE : undefined}
              >
                مسح
              </button>
            </div>
          </li>
        ))}
      </ul>

      <LocationPicker
        open={editing !== null}
        onClose={() => setEditing(null)}
        initial={editing && editing !== 'new' ? editing : null}
        village={village}
        defaultPhone={user?.phone ?? ''}
        showDefaultToggle={!(editing && editing !== 'new' && editing.isDefault)}
        defaultChecked={addresses.length === 0}
        onSave={async (draft, makeDefault) => {
          const id = editing && editing !== 'new' ? editing.id : undefined;
          await save(draft, id, makeDefault);
          setEditing(null);
          showToast(id ? '✅ العنوان اتعدّل' : '✅ العنوان اتحفظ');
        }}
      />
    </div>
  );
}

function confirmDelete(a: UserAddress): Promise<boolean> {
  return useConfirmStore.getState().ask({
    title: 'تمسح العنوان؟',
    message: `«${a.label}» هيتمسح من عناوينك.`,
    confirmLabel: 'امسح',
    cancelLabel: 'لأ',
  });
}
