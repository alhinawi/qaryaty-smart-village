// ─── One shared trip: details, call/WhatsApp, "عايز أنضم", and the owner's controls
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ROUTES, rideEditPath, ridePath } from '@/routes';
import { rideRepo } from '@/repositories';
import { Modal } from '@/components/ui/Modal';
import {
  RIDE_REPORT_REASONS,
  canRenewRide,
  isRideLive,
  priceLabel,
  rideDaysLeft,
  ridePhoneLink,
  rideWhatsappLink,
  ridersLabel,
  scheduleLabel,
  seatsLabel,
  seatsLeft,
  timeLabel,
} from '@/config/rides';
import { egyptianPhoneSchema } from '@/utils/validators';
import { useAuthStore, selectCanReview, selectUser } from '@/stores/useAuthStore';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { useUIStore } from '@/stores/useUIStore';
import { PhoneField } from '@/pages/Auth/AuthLayout';
import type { Ride, RideReportReason, RideRequest } from '@/repositories/rides/types';
import { dangerBtn, outlineBtn, primaryBtn, useSignInFirst } from '@/pages/Jobs/jobUi';
import { BackLink, JoinRequestRow, KindBadge, RequestStatusBadge, RideSafetyNote, RideStatusBadge, RidersBadge, errorText } from './parts';

export default function RideDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const canReview = useAuthStore(selectCanReview);
  const showToast = useUIStore((s) => s.showToast);
  const signInFirst = useSignInFirst();
  const [loaded, setLoaded] = useState<{ id: string; ride: Ride | null } | null>(null);
  const ride = loaded && loaded.id === id ? loaded.ride : undefined;
  const setRide = (next: Ride | null) => setLoaded({ id, ride: next });
  const [mine, setMine] = useState<RideRequest | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const loadRequests = useCallback(
    async (r: Ride | null) => {
      if (!user || !r) return;
      if (r.ownerId === user.id) {
        const all = await rideRepo.requestsOnMyRides(user.id);
        setRequests(all.filter((q) => q.rideId === r.id));
      } else {
        setMine(await rideRepo.myRequest(r.id, user.id));
      }
    },
    [user]
  );

  useEffect(() => {
    let alive = true;
    rideRepo
      .get(id)
      .then(async (r) => {
        if (!alive) return;
        setLoaded({ id, ride: r });
        await loadRequests(r);
      })
      .catch(() => alive && setLoaded({ id, ride: null }));
    return () => {
      alive = false;
    };
  }, [id, loadRequests]);

  useEffect(() => {
    if (ride) document.title = `${ride.fromVillage} ← ${ride.toPlace} | شير مواصلة`;
  }, [ride]);

  if (ride === undefined) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-5" aria-busy="true">
        <div className="h-[260px] bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (ride === null) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
        <BackLink to={ROUTES.rides} label="شير مواصلة" />
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm mt-2">
          <div className="text-4xl mb-2" aria-hidden="true">
            💭
          </div>
          <p className="font-extrabold m-0">المشوار ده مش موجود</p>
          <p className="text-[13px] text-text-muted mt-1 mb-4">ممكن يكون صاحبه وقّفه، أو مدته خلصت.</p>
          <Link to={ROUTES.rides} className={primaryBtn}>
            شوف باقي المشاوير
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = !!user && user.id === ride.ownerId;
  const live = isRideLive(ride);
  const left = seatsLeft(ride);

  const run = async (fn: () => Promise<Ride | void>, done: string) => {
    setBusy(true);
    try {
      const next = await fn();
      if (next) setRide(next);
      showToast(done);
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const respond = async (request: RideRequest, accept: boolean) => {
    setBusy(true);
    try {
      await rideRepo.respond(request.id, accept);
      const fresh = await rideRepo.get(ride.id);
      if (fresh) setRide(fresh);
      await loadRequests(fresh ?? ride);
      showToast(accept ? 'اتقبل، كلّمه واتفقوا على مكان المقابلة' : 'تمام');
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await useConfirmStore.getState().ask({
      title: 'تمسح المشوار؟',
      message: 'المشوار وطلباته هيتمسحوا خالص، ومش هتقدر ترجّعهم.',
      confirmLabel: 'امسح',
      cancelLabel: 'لأ',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await rideRepo.remove(ride.id);
      showToast('اتمسح المشوار');
      navigate(isOwner ? ROUTES.ridesMine : canReview ? ROUTES.ridesReview : ROUTES.rides, { replace: true });
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
      setBusy(false);
    }
  };

  const cancelMine = async () => {
    if (!mine) return;
    const ok = await useConfirmStore.getState().ask({
      title: 'تلغي طلبك؟',
      message: mine.status === 'accepted' ? 'هتسيب مكانك في المشوار. ابقى قول لصاحبه كمان.' : 'طلبك هيتلغى.',
      confirmLabel: 'الغي',
      cancelLabel: 'لأ',
    });
    if (!ok) return;
    setBusy(true);
    try {
      setMine(await rideRepo.cancelRequest(mine.id));
      const fresh = await rideRepo.get(ride.id);
      if (fresh) setRide(fresh);
      showToast('اتلغى طلبك');
    } catch (err) {
      showToast(`⚠️ ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const banner =
    ride.status === 'hidden'
      ? '🚩 المشوار مستخبي لأن ناس بلّغت عنه، والإدارة هتراجعه.'
      : ride.status === 'paused'
        ? '⏸️ المشوار متوقف مؤقتًا، ومش ظاهر في القايمة.'
        : !live
          ? ride.schedule === 'once'
            ? '⌛ يوم المشوار عدّى. عدّل اليوم لو هتطلع تاني.'
            : '⌛ مدة المشوار خلصت. جدّده علشان يظهر 30 يوم كمان.'
          : '';

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <BackLink to={isOwner && !live ? ROUTES.ridesMine : ROUTES.rides} label={isOwner && !live ? 'مشاويري' : 'شير مواصلة'} />

      {(isOwner || canReview || mine) && banner && (
        <div className="bg-[#FFF8E1] border border-gold-light rounded-2xl p-3 text-[13px] mb-3 mt-1" role="status">
          {banner}
        </div>
      )}

      <article className="bg-white rounded-2xl p-5 shadow-sm mt-1">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <KindBadge ride={ride} />
          <RidersBadge ride={ride} />
          {(isOwner || canReview) && <RideStatusBadge ride={ride} />}
        </div>
        <h1 className="text-[clamp(1.2rem,4vw,1.5rem)] font-black text-text m-0 leading-snug">
          {ride.fromVillage} <span className="text-green" aria-label="إلى">←</span> {ride.toPlace}
        </h1>
        {ride.ownerName && <p className="text-[14px] text-text-muted m-0 mt-1">👤 {ride.ownerName}</p>}

        <dl className="grid grid-cols-2 gap-2 mt-4 mb-0">
          <div className="bg-cream rounded-xl p-3">
            <dt className="text-[11px] text-text-muted">الطلوع</dt>
            <dd className="m-0 font-extrabold text-[14px]">{timeLabel(ride.departTime)}</dd>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <dt className="text-[11px] text-text-muted">الرجوع</dt>
            <dd className="m-0 font-extrabold text-[14px]">{ride.returnTime ? timeLabel(ride.returnTime) : 'رايح بس'}</dd>
          </div>
          <div className="bg-cream rounded-xl p-3 col-span-2">
            <dt className="text-[11px] text-text-muted">الأيام</dt>
            <dd className="m-0 font-extrabold text-[14px]">{scheduleLabel(ride)}</dd>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <dt className="text-[11px] text-text-muted">{ride.kind === 'car' ? 'الكراسي' : 'محتاج'}</dt>
            <dd className={`m-0 font-extrabold text-[14px] ${left ? 'text-green-dark' : 'text-[#b42318]'}`}>{seatsLabel(ride)}</dd>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <dt className="text-[11px] text-text-muted">{ride.kind === 'car' ? 'السعر الرمزي' : 'الأجرة'}</dt>
            <dd className="m-0 font-extrabold text-[14px] text-green-dark">{priceLabel(ride)}</dd>
          </div>
          {ride.carType && (
            <div className="bg-cream rounded-xl p-3">
              <dt className="text-[11px] text-text-muted">العربية</dt>
              <dd className="m-0 font-extrabold text-[14px]">{ride.carType}</dd>
            </div>
          )}
          <div className={`bg-cream rounded-xl p-3 ${ride.carType ? '' : 'col-span-2'}`}>
            <dt className="text-[11px] text-text-muted">مين ينفع يركب</dt>
            <dd className="m-0 font-extrabold text-[14px]">{ridersLabel(ride.riders)}</dd>
          </div>
        </dl>

        {ride.notes && (
          <>
            <h2 className="text-[15px] font-extrabold text-green-dark mt-5 mb-1">ملاحظات</h2>
            <p className="text-[14px] leading-relaxed whitespace-pre-line m-0">{ride.notes}</p>
          </>
        )}
        {isOwner && live && ride.schedule !== 'once' && (
          <p className="text-[12px] text-text-muted mt-4 mb-0">فاضل {rideDaysLeft(ride)} يوم على المشوار</p>
        )}
      </article>

      {/* Contact + join */}
      {!isOwner && (live || mine?.status === 'accepted') && (
        <section className="bg-white rounded-2xl p-4 shadow-sm mt-3" aria-labelledby="rideContactTitle">
          <h2 id="rideContactTitle" className="text-[15px] font-extrabold text-green-dark m-0 mb-3">
            كلّم صاحب المشوار
          </h2>
          <div className="flex flex-wrap gap-2">
            <a href={ridePhoneLink(ride.phone)} className={`${primaryBtn} flex-1 min-w-[140px]`}>
              📞 اتصل
            </a>
            {ride.whatsapp && (
              <a
                href={rideWhatsappLink(ride)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${outlineBtn} flex-1 min-w-[140px] !border-[#25D366] !text-[#128C7E]`}
              >
                💬 واتساب
              </a>
            )}
          </div>
          <p className="text-[12px] text-text-muted mt-2 mb-0" dir="ltr" style={{ textAlign: 'right' }}>
            {ride.phone}
          </p>

          <div className="border-t border-[#eee] mt-4 pt-4">
            {mine && (mine.status === 'pending' || mine.status === 'accepted') ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 font-extrabold text-[14px]">🙋 طلبت تنضم ({mine.seats === 1 ? 'كرسي' : `${mine.seats} كراسي`})</p>
                  <RequestStatusBadge status={mine.status} />
                </div>
                <p className="text-[13px] text-text-muted mt-1 mb-2">
                  {mine.status === 'pending'
                    ? 'صاحب المشوار هيشوف طلبك ورقمك في «مشاويري». لو مستعجل كلّمه على طول.'
                    : 'مبروك، صاحب المشوار وافق. اتفقوا على مكان المقابلة.'}
                </p>
                <button type="button" disabled={busy} className={`${outlineBtn} w-full`} onClick={cancelMine}>
                  الغي طلبي
                </button>
              </div>
            ) : mine?.status === 'declined' ? (
              <p className="m-0 text-[13px] text-text-muted">صاحب المشوار ماوافقش على طلبك المرة دي. شوف مشاوير تانية.</p>
            ) : left === 0 ? (
              <p className="m-0 text-[13px] text-text-muted">المشوار اكتمل. ممكن تكلّم صاحبه لو فضي مكان.</p>
            ) : user ? (
              <JoinForm
                ride={ride}
                defaultPhone={user.phone ?? ''}
                onSent={async (q) => {
                  setMine(q);
                  showToast('طلبك وصل لصاحب المشوار');
                }}
              />
            ) : (
              <button type="button" className={`${outlineBtn} w-full`} onClick={() => signInFirst(ridePath(ride.id))}>
                🙋 عايز أنضم (سجّل دخولك الأول)
              </button>
            )}
          </div>
        </section>
      )}

      {/* The owner's requests and controls */}
      {isOwner && (
        <>
          <section className="bg-white rounded-2xl p-4 shadow-sm mt-3" aria-labelledby="rideRequestsTitle">
            <h2 id="rideRequestsTitle" className="text-[15px] font-extrabold text-green-dark m-0 mb-2">
              🙋 طلبات الانضمام
            </h2>
            {requests.length === 0 ? (
              <p className="m-0 text-[13px] text-text-muted">لسه مفيش حد طلب. الناس كمان ممكن تكلمك على الرقم مباشرة.</p>
            ) : (
              <ul className="flex flex-col gap-2 p-0 m-0">
                {requests.map((q) => (
                  <JoinRequestRow key={q.id} request={q} ride={ride} busy={busy} onRespond={(accept) => respond(q, accept)} />
                ))}
              </ul>
            )}
          </section>
          <section className="bg-white rounded-2xl p-4 shadow-sm mt-3" aria-label="تحكم في مشوارك">
            <div className="flex flex-wrap gap-2">
              <Link to={rideEditPath(ride.id)} className={`${outlineBtn} flex-1`}>
                ✏️ عدّل
              </Link>
              {canRenewRide(ride) && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${primaryBtn} flex-1`}
                  onClick={() => run(() => rideRepo.renew(ride.id), 'اتجدّد المشوار 30 يوم')}
                >
                  🔄 جدّد 30 يوم
                </button>
              )}
              {ride.status !== 'hidden' && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${outlineBtn} flex-1`}
                  onClick={() =>
                    run(
                      () => rideRepo.setPaused(ride.id, ride.status === 'active'),
                      ride.status === 'active' ? 'المشوار اتوقف ومبقاش ظاهر' : 'المشوار رجع يظهر'
                    )
                  }
                >
                  {ride.status === 'active' ? '⏸️ وقّفه مؤقتًا' : '▶️ رجّعه'}
                </button>
              )}
              <button type="button" disabled={busy} className={`${dangerBtn} flex-1`} onClick={remove}>
                🗑️ امسح
              </button>
            </div>
          </section>
        </>
      )}

      <div className="mt-3">
        <RideSafetyNote />
      </div>

      {!isOwner && live && (
        <button
          type="button"
          className="mt-3 min-h-[44px] w-full rounded-xl bg-transparent border-0 text-[13px] font-bold text-[#b42318] cursor-pointer font-[Cairo,sans-serif]"
          onClick={() => (user ? setReportOpen(true) : signInFirst(ridePath(ride.id)))}
        >
          🚩 بلّغ عن المشوار ده
        </button>
      )}

      {canReview && !isOwner && (
        <section className="bg-white rounded-2xl p-4 shadow-sm mt-3 border-2 border-gold-light" aria-label="الإدارة">
          <p className="text-[13px] font-extrabold text-green-dark m-0 mb-2">
            ⚙️ الإدارة{ride.reportsCount > 0 && ` · اتبلّغ عنه ${ride.reportsCount} مرة`}
          </p>
          <div className="flex flex-wrap gap-2">
            {ride.status === 'hidden' && (
              <button
                type="button"
                disabled={busy}
                className={`${primaryBtn} flex-1`}
                onClick={() => run(() => rideRepo.restore(ride.id), 'المشوار رجع يظهر')}
              >
                ✔️ رجّعه
              </button>
            )}
            <button type="button" disabled={busy} className={`${dangerBtn} flex-1`} onClick={remove}>
              🗑️ امسح
            </button>
          </div>
        </section>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSend={async (reason, note) => {
          try {
            await rideRepo.report(ride.id, reason, note);
            setReportOpen(false);
            showToast('شكرًا، الإدارة هتراجع المشوار');
          } catch (err) {
            showToast(`⚠️ ${errorText(err)}`);
          }
        }}
      />
    </div>
  );
}

function JoinForm({ ride, defaultPhone, onSent }: { ride: Ride; defaultPhone: string; onSent: (q: RideRequest) => void }) {
  const max = Math.min(3, seatsLeft(ride));
  const [open, setOpen] = useState(false);
  const [seats, setSeats] = useState(1);
  const [phone, setPhone] = useState(defaultPhone);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) {
    return (
      <div>
        <button type="button" className={`${outlineBtn} w-full`} onClick={() => setOpen(true)}>
          🙋 عايز أنضم
        </button>
        <p className="text-[12px] text-text-muted mt-1 mb-0 text-center">صاحب المشوار هيشوف طلبك ويوافق أو يعتذر</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = egyptianPhoneSchema.safeParse(phone);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'الرقم مش مظبوط');
          return;
        }
        setError('');
        setSending(true);
        try {
          onSent(await rideRepo.requestJoin(ride.id, seats, parsed.data, note));
        } catch (err) {
          setError(errorText(err));
        } finally {
          setSending(false);
        }
      }}
    >
      <p className="m-0 mb-2 font-extrabold text-[14px]">🙋 عايز أنضم</p>
      {max > 1 && (
        <fieldset className="border-0 p-0 m-0 mb-2">
          <legend className="text-[13px] font-bold mb-1">كام كرسي؟</legend>
          <div className="flex gap-2">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <label
                key={n}
                className={`flex-1 flex items-center justify-center min-h-[44px] rounded-xl border-2 cursor-pointer font-extrabold ${
                  seats === n ? 'border-green bg-[#E6F4EC] text-green-dark' : 'border-[#e5e7eb]'
                }`}
              >
                <input type="radio" name="join-seats" className="sr-only" checked={seats === n} onChange={() => setSeats(n)} />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <PhoneField
        id="join-phone"
        label="رقمك"
        hint="صاحب المشوار بس اللي هيشوفه"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <div className="form-group">
        <label htmlFor="join-note">رسالة قصيرة (لو حابب)</label>
        <input
          id="join-note"
          type="text"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="مثلًا: بنزل عند موقف الجامعة"
        />
      </div>
      {error && (
        <p className="input-error-msg mb-2" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={sending} className={`${primaryBtn} w-full`}>
        {sending ? 'بنبعت…' : 'ابعت الطلب'}
      </button>
    </form>
  );
}

function ReportModal({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (reason: RideReportReason, note: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<RideReportReason>('commercial');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  return (
    <Modal isOpen={open} onClose={onClose} title="بلّغ عن المشوار" emoji="🚩" maxWidth="440px">
      <form
        dir="rtl"
        onSubmit={async (e) => {
          e.preventDefault();
          setSending(true);
          await onSend(reason, note);
          setSending(false);
        }}
      >
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="text-[13px] text-text-muted mb-2">إيه المشكلة؟</legend>
          {RIDE_REPORT_REASONS.map((r) => (
            <label
              key={r.id}
              className={`flex items-center gap-2 min-h-[44px] px-3 rounded-xl border-2 cursor-pointer text-[14px] font-bold ${
                reason === r.id ? 'border-green bg-[#E6F4EC]' : 'border-[#e5e7eb]'
              }`}
            >
              <input type="radio" name="rideReportReason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
              {r.label}
            </label>
          ))}
        </fieldset>
        <div className="form-group mt-3">
          <label htmlFor="rideReportNote">تفاصيل (لو حابب)</label>
          <textarea id="rideReportNote" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="submit" disabled={sending} className={`${primaryBtn} w-full mt-2`}>
          {sending ? 'بنبعت…' : 'ابعت البلاغ'}
        </button>
      </form>
    </Modal>
  );
}
