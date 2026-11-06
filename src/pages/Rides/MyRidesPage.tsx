// ─── "مشاويري": the trips you posted with their join requests, and the requests you sent
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ROUTES, ridePath } from '@/routes';
import { rideRepo } from '@/repositories';
import { routeLabel, scheduleLabel, timeLabel } from '@/config/rides';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import type { Ride, RideRequest } from '@/repositories/rides/types';
import { primaryBtn } from '@/pages/Jobs/jobUi';
import { BackLink, JoinRequestRow, RequestStatusBadge, RideCard, errorText } from './parts';

type Tab = 'posted' | 'sent';

export default function MyRidesPage() {
  const user = useAuthStore(selectUser);
  const { pathname } = useLocation();
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<Tab>('posted');
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [incoming, setIncoming] = useState<RideRequest[]>([]);
  const [sent, setSent] = useState<RideRequest[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Fetching returns the lists; the caller puts them on screen (no state set inside the effect itself)
  const fetchAll = useCallback(async () => {
    if (!user) return null;
    const [mine, onMine, outgoing] = await Promise.all([
      rideRepo.listMine(user.id),
      rideRepo.requestsOnMyRides(user.id),
      rideRepo.myRequests(user.id),
    ]);
    return { mine, onMine, outgoing };
  }, [user]);

  const show = useCallback((lists: Awaited<ReturnType<typeof fetchAll>>) => {
    if (!lists) return;
    setRides(lists.mine);
    setIncoming(lists.onMine);
    setSent(lists.outgoing);
  }, []);

  const load = useCallback(async () => show(await fetchAll()), [fetchAll, show]);

  useEffect(() => {
    document.title = 'مشاويري | شير مواصلة';
    let alive = true;
    fetchAll()
      .then((lists) => alive && show(lists))
      .catch(() => {
        if (!alive) return;
        setRides([]);
        setSent([]);
      });
    return () => {
      alive = false;
    };
  }, [fetchAll, show]);

  if (!user) return <Navigate to={ROUTES.login} state={{ from: pathname }} replace />;

  const respond = async (request: RideRequest, accept: boolean) => {
    setBusy(true);
    try {
      await rideRepo.respond(request.id, accept);
      await load();
      showToast(accept ? 'اتقبل، كلّمه واتفقوا على مكان المقابلة' : 'تمام');
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const pending = incoming.filter((q) => q.status === 'pending').length;
  const tabBtn = (id: Tab, label: string, badge = 0) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`flex-1 min-h-[44px] rounded-xl border-0 text-[14px] font-extrabold cursor-pointer font-[Cairo,sans-serif] ${
        tab === id ? 'bg-green text-white' : 'bg-transparent text-text'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 mr-1.5 rounded-full bg-gold text-[11px] text-text">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <BackLink to={ROUTES.rides} label="شير مواصلة" />
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mt-1 mb-3">📋 مشاويري</h1>

      <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm mb-3" role="tablist">
        {tabBtn('posted', 'اللي نزّلتها', pending)}
        {tabBtn('sent', 'طلباتي')}
      </div>

      {tab === 'posted' ? (
        rides === null ? (
          <div className="h-[140px] bg-white rounded-2xl animate-pulse" aria-busy="true" />
        ) : rides.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="font-extrabold m-0">لسه مانزّلتش مشاوير</p>
            <p className="text-[13px] text-text-muted mt-1 mb-4">لو بتطلع كل يوم في نفس الميعاد، نزّل مشوارك وشيّر المصاريف.</p>
            <Link to={ROUTES.ridesNew} className={primaryBtn}>
              ➕ نزّل مشوارك
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 p-0 m-0 list-none">
            {rides.map((ride) => {
              const requests = incoming.filter((q) => q.rideId === ride.id && q.status !== 'cancelled');
              return (
                <li key={ride.id}>
                  <RideCard ride={ride} showStatus />
                  {requests.length > 0 && (
                    <div className="bg-white rounded-b-2xl -mt-3 pt-5 px-3 pb-3 shadow-sm">
                      <p className="text-[13px] font-extrabold text-green-dark m-0 mb-2">🙋 طلبات الانضمام</p>
                      <ul className="flex flex-col gap-2 p-0 m-0">
                        {requests.map((q) => (
                          <JoinRequestRow key={q.id} request={q} ride={ride} busy={busy} onRespond={(accept) => respond(q, accept)} />
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : sent === null ? (
        <div className="h-[140px] bg-white rounded-2xl animate-pulse" aria-busy="true" />
      ) : sent.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="font-extrabold m-0">ماطلبتش تنضم لأي مشوار لسه</p>
          <p className="text-[13px] text-text-muted mt-1 mb-4">دوّر على مشوار طالع في ميعادك ودوس «عايز أنضم».</p>
          <Link to={ROUTES.rides} className={primaryBtn}>
            شوف المشاوير
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 p-0 m-0 list-none">
          {sent.map((q) => (
            <li key={q.id}>
              <Link
                to={ridePath(q.rideId)}
                className="block bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent hover:border-green no-underline text-text"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 font-extrabold text-[15px]">{q.ride ? routeLabel(q.ride) : 'مشوار مبقاش متاح'}</p>
                    {q.ride && (
                      <p className="m-0 mt-0.5 text-[13px] text-text-muted">
                        🕒 {timeLabel(q.ride.departTime)} · 📅 {scheduleLabel(q.ride)}
                      </p>
                    )}
                  </div>
                  <RequestStatusBadge status={q.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
