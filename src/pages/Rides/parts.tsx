// ─── Pieces the شير مواصلة pages share
import { Link } from 'react-router';
import { ridePath } from '@/routes';
import {
  RIDE_REQUEST_STATUS,
  RIDE_SAFETY_POINTS,
  isRideLive,
  priceLabel,
  rideKindIcon,
  rideKindLabel,
  riderWhatsappLink,
  ridePhoneLink,
  ridersLabel,
  rideStatusLabel,
  routeLabel,
  scheduleLabel,
  seatsLabel,
  seatsLeft,
  timeLabel,
} from '@/config/rides';
import type { Ride, RideRequest } from '@/repositories/rides/types';
import { outlineBtn, primaryBtn } from '@/pages/Jobs/jobUi';

export { BackLink } from '@/pages/Jobs/parts';

export function errorText(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'حصلت مشكلة، جرّب تاني';
}

export function RideSafetyNote({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 bg-[#FFF8E1] border border-gold-light rounded-2xl text-[13px] leading-relaxed text-text ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <span className="text-lg leading-none shrink-0" aria-hidden="true">
        🛡️
      </span>
      {compact ? (
        <p className="m-0">
          <strong className="text-green-dark">خلي بالك: </strong>
          قول لأهلك إنت رايح مع مين، واتقابلوا في مكان عام، وماتدفعش فلوس مقدم. والعربيات بسعر رمزي بس.
        </p>
      ) : (
        <div>
          <strong className="text-green-dark">علشان مشوارك يبقى آمن:</strong>
          <ul className="m-0 mt-1 pr-4 list-disc">
            {RIDE_SAFETY_POINTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function KindBadge({ ride }: { ride: Pick<Ride, 'kind'> }) {
  const car = ride.kind === 'car';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-extrabold rounded-full px-2.5 py-1 whitespace-nowrap ${
        car ? 'bg-[#E8F0FE] text-[#1a4fa0]' : 'bg-[#FFF3CD] text-[#7a5600]'
      }`}
    >
      <span aria-hidden="true">{rideKindIcon(ride.kind)}</span>
      {rideKindLabel(ride.kind)}
    </span>
  );
}

export function RidersBadge({ ride }: { ride: Pick<Ride, 'riders'> }) {
  if (ride.riders === 'any') return null;
  return (
    <span
      className={`inline-flex items-center text-[11px] font-extrabold rounded-full px-2.5 py-1 ${
        ride.riders === 'women' ? 'bg-[#FCE7F3] text-[#9d174d]' : 'bg-[#E0F2FE] text-[#075985]'
      }`}
    >
      {ridersLabel(ride.riders)}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-[#E6F4EC] text-green-dark',
  paused: 'bg-[#EEF0F2] text-text-muted',
  hidden: 'bg-[#FDECEC] text-[#b42318]',
  ended: 'bg-[#EEF0F2] text-text-muted',
};

export function RideStatusBadge({ ride }: { ride: Pick<Ride, 'status' | 'expiresAt'> }) {
  const key = ride.status === 'hidden' ? 'hidden' : !isRideLive({ ...ride, status: 'active' }) ? 'ended' : ride.status === 'paused' ? 'paused' : 'live';
  return (
    <span className={`inline-flex items-center text-[11px] font-extrabold rounded-full px-2.5 py-1 whitespace-nowrap ${STATUS_STYLES[key]}`}>
      {rideStatusLabel(ride)}
    </span>
  );
}

export function RideCard({ ride, showStatus = false, extra }: { ride: Ride; showStatus?: boolean; extra?: React.ReactNode }) {
  const full = seatsLeft(ride) === 0;
  return (
    <Link
      to={ridePath(ride.id)}
      className="block bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent hover:border-green transition-colors no-underline text-text"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold text-text m-0 leading-snug">{routeLabel(ride)}</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">
            🕒 {timeLabel(ride.departTime)}
            {ride.returnTime && ` · رجوع ${timeLabel(ride.returnTime)}`}
          </p>
        </div>
        {showStatus ? <RideStatusBadge ride={ride} /> : <KindBadge ride={ride} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-[12px] text-text-muted">
        {showStatus && <KindBadge ride={ride} />}
        <span>📅 {scheduleLabel(ride)}</span>
        <span className={full ? 'font-bold text-[#b42318]' : 'font-bold text-green-dark'}>💺 {seatsLabel(ride)}</span>
        <span className="font-bold text-green-dark">💰 {priceLabel(ride)}</span>
        <RidersBadge ride={ride} />
        {ride.ownerName && <span>👤 {ride.ownerName}</span>}
      </div>
      {extra}
    </Link>
  );
}

const REQUEST_STYLES: Record<string, string> = {
  pending: 'bg-[#FFF3CD] text-[#8a6100]',
  accepted: 'bg-[#E6F4EC] text-green-dark',
  declined: 'bg-[#FDECEC] text-[#b42318]',
  cancelled: 'bg-[#EEF0F2] text-text-muted',
};

export function RequestStatusBadge({ status }: { status: RideRequest['status'] }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-extrabold rounded-full px-2.5 py-1 whitespace-nowrap ${REQUEST_STYLES[status]}`}>
      {RIDE_REQUEST_STATUS[status]}
    </span>
  );
}

/** One "عايز أنضم" request, as the poster sees it */
export function JoinRequestRow({
  request,
  ride,
  busy,
  onRespond,
}: {
  request: RideRequest;
  ride: Pick<Ride, 'fromVillage' | 'toPlace' | 'seats' | 'seatsTaken'>;
  busy: boolean;
  onRespond: (accept: boolean) => void;
}) {
  const open = request.status === 'pending' || request.status === 'accepted';
  return (
    <li className="border border-[#e5e7eb] rounded-xl p-3 list-none">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 font-extrabold text-[14px]">
            🙋 {request.requesterName || 'حد من القرية'}
            <span className="font-bold text-text-muted text-[12px]"> · {request.seats === 1 ? 'كرسي واحد' : request.seats === 2 ? 'كرسيين' : `${request.seats} كراسي`}</span>
          </p>
          {request.note && <p className="m-0 mt-1 text-[13px] text-text">«{request.note}»</p>}
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      {open && (
        <div className="flex flex-wrap gap-2 mt-2">
          <a href={ridePhoneLink(request.phone)} className={`${outlineBtn} flex-1 min-w-[110px] !min-h-[40px]`}>
            📞 اتصل
          </a>
          <a
            href={riderWhatsappLink(request.phone, ride)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${outlineBtn} flex-1 min-w-[110px] !min-h-[40px] !border-[#25D366] !text-[#128C7E]`}
          >
            💬 واتساب
          </a>
        </div>
      )}
      {request.status === 'pending' && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            disabled={busy || request.seats > seatsLeft(ride)}
            className={`${primaryBtn} flex-1 !min-h-[40px]`}
            onClick={() => onRespond(true)}
          >
            ✔️ موافق
          </button>
          <button type="button" disabled={busy} className={`${outlineBtn} flex-1 !min-h-[40px]`} onClick={() => onRespond(false)}>
            ✖️ مش دلوقتي
          </button>
        </div>
      )}
      {request.status === 'accepted' && (
        <button
          type="button"
          disabled={busy}
          className="mt-2 min-h-[40px] w-full rounded-xl bg-transparent border-0 text-[13px] font-bold text-[#b42318] cursor-pointer font-[Cairo,sans-serif]"
          onClick={() => onRespond(false)}
        >
          شيله من المشوار
        </button>
      )}
    </li>
  );
}
