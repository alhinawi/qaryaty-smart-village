// ─── Admin: trips hidden after 3 reports — show again or delete
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { ROUTES } from '@/routes';
import { rideRepo } from '@/repositories';
import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { useUIStore } from '@/stores/useUIStore';
import type { Ride } from '@/repositories/rides/types';
import { dangerBtn, primaryBtn } from '@/pages/Jobs/jobUi';
import { BackLink, RideCard, errorText } from './parts';

export default function RidesReviewPage() {
  const isAdmin = useAuthStore(selectIsAdmin);
  const showToast = useUIStore((s) => s.showToast);
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'بلاغات شير المواصلة | قريتي';
    if (!isAdmin) return;
    rideRepo
      .listHidden()
      .then(setRides)
      .catch((err) => {
        setError(errorText(err));
        setRides([]);
      });
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to={ROUTES.rides} replace />;

  const act = async (ride: Ride, restore: boolean) => {
    if (!restore) {
      const ok = await useConfirmStore.getState().ask({
        title: 'تمسح المشوار؟',
        message: 'المشوار وطلباته وبلاغاته هيتمسحوا خالص.',
        confirmLabel: 'امسح',
        cancelLabel: 'لأ',
      });
      if (!ok) return;
    }
    setBusy(ride.id);
    try {
      if (restore) await rideRepo.restore(ride.id);
      else await rideRepo.remove(ride.id);
      setRides((list) => (list ?? []).filter((r) => r.id !== ride.id));
      showToast(restore ? 'المشوار رجع يظهر' : 'اتمسح المشوار');
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <BackLink to={ROUTES.rides} label="شير مواصلة" />
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mt-1">🚩 بلاغات شير المواصلة</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-4">
        المشاوير بتنزل على طول، وأي مشوار ياخد 3 بلاغات بيستخبى لوحده وييجي هنا. رجّعه لو سليم، أو امسحه.
      </p>
      {error && (
        <p className="input-error-msg mb-3" role="alert">
          {error}
        </p>
      )}
      {rides === null ? (
        <div className="h-[140px] bg-white rounded-2xl animate-pulse" aria-busy="true" />
      ) : rides.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-4xl mb-2" aria-hidden="true">
            ✅
          </div>
          <p className="font-extrabold m-0">مفيش مشاوير مستخبية</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 p-0 m-0 list-none">
          {rides.map((ride) => (
            <li key={ride.id}>
              <RideCard
                ride={ride}
                showStatus
                extra={<p className="text-[12px] font-bold text-[#b42318] m-0 mt-2">🚩 {ride.reportsCount} بلاغات</p>}
              />
              <div className="flex gap-2 mt-2">
                <button type="button" disabled={busy === ride.id} className={`${primaryBtn} flex-1`} onClick={() => act(ride, true)}>
                  ✔️ رجّعه
                </button>
                <button type="button" disabled={busy === ride.id} className={`${dangerBtn} flex-1`} onClick={() => act(ride, false)}>
                  🗑️ امسح
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
