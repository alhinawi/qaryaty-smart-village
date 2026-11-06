// ─── Shared trips in Supabase (tables `rides`, `ride_requests`, `ride_reports`)
// RLS shows everyone the live posts and each person their own; joining goes
// through database functions so the taken seats always match the accepted requests.
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '../errors';
import { isRejectedByDatabase } from '../orders/supabaseOrderRepo';
import type {
  Ride,
  RideDraft,
  RideKind,
  RideRepo,
  RideRequest,
  RideRequestStatus,
  RideRiders,
  RideSchedule,
  RideStatus,
} from './types';

const COLUMNS =
  'id, owner_id, owner_name, kind, from_village, to_place, depart_time, return_time, schedule, days, ride_date, seats, seats_taken, price, car_type, notes, riders, contact_phone, whatsapp, status, reports_count, expires_at, created_at, updated_at';
const REQUEST_COLUMNS = 'id, ride_id, requester_id, requester_name, phone, seats, note, status, created_at, updated_at';

const MESSAGES: Record<string, string> = {
  'rides:too_many_requests': 'بعتّ طلبات كتير النهارده، جرّب بكرة.',
  'rides:too_many': 'نزّلت 5 مشاوير النهارده، جرّب بكرة.',
  'rides:blocked': 'حسابك موقوف، ومش هنقدر نكمّل.',
  'rides:bad_date': 'اختار يوم من النهارده لحد 30 يوم قدام.',
  'rides:seats_taken': 'ماتقدرش تقلّل الكراسي عن عدد الناس اللي قبلتهم.',
  'rides:too_early': 'تقدر تجدّد في آخر 7 أيام من المدة.',
  'rides:once': 'المشوار اللي مرة واحدة مابيتجدّدش، عدّل اليوم بداله.',
  'rides:not_active': 'المشوار ده مش متاح دلوقتي.',
  'rides:own_ride': 'ده مشوارك إنت.',
  'rides:no_seats': 'مفيش كراسي فاضية كفاية.',
  'rides:already_requested': 'إنت طالب تنضم للمشوار ده قبل كده.',
  'rides:declined': 'صاحب المشوار ماوافقش على طلبك.',
  'rides:request_not_found': 'الطلب ده مش موجود.',
  'rides:request_closed': 'الطلب ده اتقفل خلاص.',
  'rides:sign_in': 'سجّل دخولك الأول.',
  'rides:not_found': 'المشوار ده مش موجود.',
};
const REJECTED_MESSAGE = 'المشوار مااتحفظش، راجع البيانات وجرّب تاني';
const ALREADY_REPORTED = 'إنت بلّغت عن المشوار ده قبل كده، وهنراجعه.';

export function rideErrorMessage(message: string | undefined): string {
  // Longest key first, so rides:too_many_requests wins over rides:too_many
  const key = Object.keys(MESSAGES)
    .sort((a, b) => b.length - a.length)
    .find((k) => message?.includes(k));
  return key ? MESSAGES[key] : REJECTED_MESSAGE;
}

export interface RideRow {
  id: string;
  owner_id: string;
  owner_name: string;
  kind: RideKind;
  from_village: string;
  to_place: string;
  depart_time: string;
  return_time: string | null;
  schedule: RideSchedule;
  days: number[] | null;
  ride_date: string | null;
  seats: number;
  seats_taken: number;
  price: number | null;
  car_type: string;
  notes: string;
  riders: RideRiders;
  contact_phone: string;
  whatsapp: boolean;
  status: RideStatus;
  reports_count: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface RequestRow {
  id: string;
  ride_id: string;
  requester_id: string;
  requester_name: string;
  phone: string;
  seats: number;
  note: string;
  status: RideRequestStatus;
  created_at: string;
  updated_at: string;
  rides?: RideRow | null;
}

/** "07:30:00" → "07:30" */
const hhmm = (time: string | null) => (time ? time.slice(0, 5) : '');

export function rowToRide(row: RideRow): Ride {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? '',
    kind: row.kind,
    fromVillage: row.from_village,
    toPlace: row.to_place,
    departTime: hhmm(row.depart_time),
    returnTime: hhmm(row.return_time),
    schedule: row.schedule,
    days: row.days ?? [],
    rideDate: row.ride_date ?? '',
    seats: row.seats,
    seatsTaken: row.seats_taken ?? 0,
    price: row.price,
    carType: row.car_type ?? '',
    notes: row.notes ?? '',
    riders: row.riders,
    phone: row.contact_phone,
    whatsapp: row.whatsapp,
    status: row.status,
    reportsCount: row.reports_count ?? 0,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToRequest(row: RequestRow): RideRequest {
  return {
    id: row.id,
    rideId: row.ride_id,
    requesterId: row.requester_id,
    requesterName: row.requester_name ?? '',
    phone: row.phone,
    seats: row.seats,
    note: row.note ?? '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.rides !== undefined ? { ride: row.rides ? rowToRide(row.rides) : null } : {}),
  };
}

export function draftToRow(draft: RideDraft) {
  return {
    kind: draft.kind,
    from_village: draft.fromVillage.trim(),
    to_place: draft.toPlace.trim(),
    depart_time: draft.departTime,
    return_time: draft.returnTime || null,
    schedule: draft.schedule,
    days: draft.schedule === 'days' ? draft.days : [],
    ride_date: draft.schedule === 'once' ? draft.rideDate : null,
    seats: draft.seats,
    price: draft.price,
    car_type: draft.kind === 'car' ? draft.carType.trim() : '',
    notes: draft.notes.trim(),
    riders: draft.riders,
    contact_phone: draft.phone,
    whatsapp: draft.whatsapp,
  };
}

function check(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === '23505') throw new RepoError('rejected', ALREADY_REPORTED, { cause: error });
  if (isRejectedByDatabase(error.code) || error.message?.includes('rides:')) {
    throw new RepoError('rejected', rideErrorMessage(error.message), { cause: error });
  }
  throw error;
}

type Query = PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>;

export function createSupabaseRideRepo(getClient: () => Promise<SupabaseClient>): RideRepo {
  const one = async (query: Query) => {
    const { data, error } = await query;
    check(error);
    if (!data) throw new RepoError('rejected', MESSAGES['rides:not_found']);
    return rowToRide(data as RideRow);
  };
  const many = async (query: Query) => {
    const { data, error } = await query;
    check(error);
    return ((data ?? []) as RideRow[]).map(rowToRide);
  };
  const oneRequest = async (query: Query) => {
    const { data, error } = await query;
    check(error);
    if (!data) throw new RepoError('rejected', MESSAGES['rides:request_not_found']);
    return rowToRequest(data as RequestRow);
  };

  return {
    async listPublic() {
      const supabase = await getClient();
      return many(
        supabase
          .from('rides')
          .select(COLUMNS)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('depart_time', { ascending: true })
          .limit(300)
      );
    },
    async get(id) {
      const supabase = await getClient();
      const { data, error } = await supabase.from('rides').select(COLUMNS).eq('id', id).maybeSingle();
      if (error?.code === '22P02') return null; // not a uuid
      check(error);
      return data ? rowToRide(data as RideRow) : null;
    },
    async listMine(ownerId) {
      const supabase = await getClient();
      return many(supabase.from('rides').select(COLUMNS).eq('owner_id', ownerId).order('created_at', { ascending: false }));
    },
    async create(_ownerId, draft) {
      const supabase = await getClient();
      return one(supabase.from('rides').insert(draftToRow(draft)).select(COLUMNS).single());
    },
    async update(id, draft) {
      const supabase = await getClient();
      const { kind: _kind, ...row } = draftToRow(draft);
      return one(supabase.from('rides').update(row).eq('id', id).select(COLUMNS).single());
    },
    async setPaused(id, paused) {
      const supabase = await getClient();
      return one(
        supabase
          .from('rides')
          .update({ status: paused ? 'paused' : 'active' })
          .eq('id', id)
          .select(COLUMNS)
          .single()
      );
    },
    async renew(id) {
      const supabase = await getClient();
      return one(supabase.rpc('renew_ride', { p_id: id }).single());
    },
    async remove(id) {
      const supabase = await getClient();
      const { error } = await supabase.from('rides').delete().eq('id', id);
      check(error);
    },
    async report(id, reason, note) {
      const supabase = await getClient();
      const { error } = await supabase.from('ride_reports').insert({ ride_id: id, reason, note: note.trim() });
      check(error);
    },

    async requestJoin(rideId, seats, phone, note) {
      const supabase = await getClient();
      return oneRequest(
        supabase.rpc('request_ride', { p_ride: rideId, p_seats: seats, p_phone: phone, p_note: note.trim() }).single()
      );
    },
    async myRequest(rideId, userId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('ride_requests')
        .select(REQUEST_COLUMNS)
        .eq('ride_id', rideId)
        .eq('requester_id', userId)
        .maybeSingle();
      if (error?.code === '22P02') return null;
      check(error);
      return data ? rowToRequest(data as RequestRow) : null;
    },
    async requestsOnMyRides(ownerId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('ride_requests')
        .select(`${REQUEST_COLUMNS}, rides!inner(owner_id)`)
        .eq('rides.owner_id', ownerId)
        .order('created_at', { ascending: false });
      check(error);
      return ((data ?? []) as unknown as RequestRow[]).map((row) => rowToRequest({ ...row, rides: undefined }));
    },
    async myRequests(userId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('ride_requests')
        .select(`${REQUEST_COLUMNS}, rides(${COLUMNS})`)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });
      check(error);
      return ((data ?? []) as unknown as RequestRow[]).map(rowToRequest);
    },
    async respond(requestId, accept) {
      const supabase = await getClient();
      return oneRequest(supabase.rpc('respond_ride_request', { p_id: requestId, p_accept: accept }).single());
    },
    async cancelRequest(requestId) {
      const supabase = await getClient();
      return oneRequest(supabase.rpc('cancel_ride_request', { p_id: requestId }).single());
    },

    async listHidden() {
      const supabase = await getClient();
      return many(
        supabase
          .from('rides')
          .select(COLUMNS)
          .eq('status', 'hidden')
          .order('reports_count', { ascending: false })
          .order('updated_at', { ascending: false })
      );
    },
    async restore(id) {
      const supabase = await getClient();
      return one(supabase.from('rides').update({ status: 'active' }).eq('id', id).select(COLUMNS).single());
    },
  };
}
