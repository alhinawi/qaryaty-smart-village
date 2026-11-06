// ─── Demo mode: shared trips stay on this device, with the main rules of the database
import { RIDE_DAYS, RIDE_RENEW_WINDOW_DAYS, isRideLive, seatsLeft } from '@/config/rides';
import { RepoError } from '../errors';
import type { Ride, RideDraft, RideRepo, RideRequest } from './types';

const KEY = 'qaryati_rides';
const DAY = 24 * 60 * 60 * 1000;

interface Store {
  rides: Ride[];
  requests: RideRequest[];
  reported: string[];
}

function sample(id: string, draft: RideDraft, ownerName: string): Ride {
  const created = new Date(Date.now() - 2 * DAY).toISOString();
  return {
    ...draft,
    id,
    ownerId: 'demo_owner',
    ownerName,
    seatsTaken: 0,
    status: 'active',
    reportsCount: 0,
    expiresAt: new Date(Date.now() + 28 * DAY).toISOString(),
    createdAt: created,
    updatedAt: created,
  };
}

const SAMPLES: Ride[] = [
  sample(
    'demo_ride_1',
    {
      kind: 'car',
      fromVillage: 'منية سندوب',
      toPlace: 'جامعة المنصورة',
      departTime: '07:30',
      returnTime: '15:00',
      schedule: 'weekdays',
      days: [],
      rideDate: '',
      seats: 3,
      price: 10,
      carType: 'هيونداي فيرنا فضي',
      notes: 'بنزل عند بوابة الجامعة الرئيسية.',
      riders: 'any',
      phone: '01000000000',
      whatsapp: true,
    },
    'أحمد سعيد'
  ),
  sample(
    'demo_ride_2',
    {
      kind: 'taxi',
      fromVillage: 'منية سندوب',
      toPlace: 'المنصورة - موقف القاهرة',
      departTime: '06:45',
      returnTime: '',
      schedule: 'daily',
      days: [],
      rideDate: '',
      seats: 2,
      price: null,
      carType: '',
      notes: 'شغالة في المنصورة، عايزة اتنين نقسم التاكسي.',
      riders: 'women',
      phone: '01100000000',
      whatsapp: true,
    },
    'منى حسن'
  ),
];

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* fall through to the samples */
  }
  return { rides: SAMPLES, requests: [], reported: [] };
}

function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode: keep it in memory for this visit */
  }
}

function endOf(draft: RideDraft): string {
  if (draft.schedule === 'once' && draft.rideDate) {
    return new Date(`${draft.rideDate}T23:59:59`).toISOString();
  }
  return new Date(Date.now() + RIDE_DAYS * DAY).toISOString();
}

export function createMockRideRepo(): RideRepo {
  let store = load();
  const commit = () => save(store);
  const find = (id: string) => store.rides.find((r) => r.id === id) ?? null;
  const put = (ride: Ride) => {
    store = { ...store, rides: store.rides.map((r) => (r.id === ride.id ? ride : r)) };
    commit();
    return ride;
  };
  const putRequest = (req: RideRequest) => {
    store = { ...store, requests: store.requests.map((q) => (q.id === req.id ? req : q)) };
    syncTaken(req.rideId);
    commit();
    return req;
  };
  const syncTaken = (rideId: string) => {
    const taken = store.requests
      .filter((q) => q.rideId === rideId && q.status === 'accepted')
      .reduce((sum, q) => sum + q.seats, 0);
    const ride = find(rideId);
    if (ride) store = { ...store, rides: store.rides.map((r) => (r.id === rideId ? { ...r, seatsTaken: taken } : r)) };
  };
  const mustRide = (id: string) => {
    const ride = find(id);
    if (!ride) throw new RepoError('rejected', 'المشوار ده مش موجود.');
    return ride;
  };
  const mustRequest = (id: string) => {
    const req = store.requests.find((q) => q.id === id);
    if (!req) throw new RepoError('rejected', 'الطلب ده مش موجود.');
    return req;
  };

  return {
    async listPublic() {
      return store.rides.filter((r) => isRideLive(r)).sort((a, b) => a.departTime.localeCompare(b.departTime));
    },
    async get(id) {
      return find(id);
    },
    async listMine(ownerId) {
      return store.rides.filter((r) => r.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async create(ownerId, draft) {
      const now = new Date().toISOString();
      const ride: Ride = {
        ...draft,
        id: `ride_${Date.now().toString(36)}`,
        ownerId,
        ownerName: 'إنت',
        seatsTaken: 0,
        status: 'active',
        reportsCount: 0,
        expiresAt: endOf(draft),
        createdAt: now,
        updatedAt: now,
      };
      store = { ...store, rides: [ride, ...store.rides] };
      commit();
      return ride;
    },
    async update(id, draft) {
      const ride = mustRide(id);
      if (draft.seats < ride.seatsTaken) {
        throw new RepoError('rejected', 'ماتقدرش تقلّل الكراسي عن عدد الناس اللي قبلتهم.');
      }
      const dateChanged = draft.schedule !== ride.schedule || draft.rideDate !== ride.rideDate;
      return put({
        ...ride,
        ...draft,
        kind: ride.kind,
        expiresAt: dateChanged ? endOf(draft) : ride.expiresAt,
        updatedAt: new Date().toISOString(),
      });
    },
    async setPaused(id, paused) {
      const ride = mustRide(id);
      if (ride.status === 'hidden') return ride;
      return put({ ...ride, status: paused ? 'paused' : 'active' });
    },
    async renew(id) {
      const ride = mustRide(id);
      if (ride.schedule === 'once') throw new RepoError('rejected', 'المشوار اللي مرة واحدة مابيتجدّدش.');
      if (new Date(ride.expiresAt).getTime() - Date.now() > RIDE_RENEW_WINDOW_DAYS * DAY) {
        throw new RepoError('rejected', 'تقدر تجدّد في آخر 7 أيام من المدة.');
      }
      return put({ ...ride, expiresAt: new Date(Date.now() + RIDE_DAYS * DAY).toISOString() });
    },
    async remove(id) {
      store = {
        ...store,
        rides: store.rides.filter((r) => r.id !== id),
        requests: store.requests.filter((q) => q.rideId !== id),
      };
      commit();
    },
    async report(id) {
      if (store.reported.includes(id)) throw new RepoError('rejected', 'إنت بلّغت عن المشوار ده قبل كده، وهنراجعه.');
      const ride = mustRide(id);
      store = { ...store, reported: [...store.reported, id] };
      put({ ...ride, reportsCount: ride.reportsCount + 1 });
    },

    async requestJoin(rideId, seats, phone, note) {
      const ride = mustRide(rideId);
      if (seats < 1 || seats > seatsLeft(ride)) throw new RepoError('rejected', 'مفيش كراسي فاضية كفاية.');
      const now = new Date().toISOString();
      const req: RideRequest = {
        id: `req_${Date.now().toString(36)}`,
        rideId,
        requesterId: 'me',
        requesterName: 'إنت',
        phone,
        seats,
        note: note.trim(),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      store = { ...store, requests: [req, ...store.requests.filter((q) => q.rideId !== rideId || q.requesterId !== 'me')] };
      commit();
      return req;
    },
    async myRequest(rideId) {
      return store.requests.find((q) => q.rideId === rideId && q.requesterId === 'me') ?? null;
    },
    async requestsOnMyRides(ownerId) {
      const mine = new Set(store.rides.filter((r) => r.ownerId === ownerId).map((r) => r.id));
      return store.requests.filter((q) => mine.has(q.rideId));
    },
    async myRequests() {
      return store.requests.filter((q) => q.requesterId === 'me').map((q) => ({ ...q, ride: find(q.rideId) }));
    },
    async respond(requestId, accept) {
      const req = mustRequest(requestId);
      if (accept && req.seats > seatsLeft(mustRide(req.rideId))) {
        throw new RepoError('rejected', 'مفيش كراسي فاضية كفاية.');
      }
      return putRequest({ ...req, status: accept ? 'accepted' : 'declined', updatedAt: new Date().toISOString() });
    },
    async cancelRequest(requestId) {
      const req = mustRequest(requestId);
      return putRequest({ ...req, status: 'cancelled', updatedAt: new Date().toISOString() });
    },

    async listHidden() {
      return store.rides.filter((r) => r.status === 'hidden');
    },
    async restore(id) {
      const ride = mustRide(id);
      return put({ ...ride, status: 'active', reportsCount: 0 });
    },
  };
}
