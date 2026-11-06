// ─── شير مواصلة: shared trips between people who leave at the same time

/** taxi = نتشارك تاكسي (split a taxi or a microbus), car = عندي عربية (seats in my car for a token price) */
export type RideKind = 'taxi' | 'car';
/** daily = كل يوم, weekdays = الحد للخميس, days = أيام معينة, once = مرة واحدة */
export type RideSchedule = 'daily' | 'weekdays' | 'days' | 'once';
export type RideRiders = 'any' | 'women' | 'men';
/** hidden = reported 3 times, waits for the admin */
export type RideStatus = 'active' | 'paused' | 'hidden';
export type RideReportReason = 'commercial' | 'asks_money' | 'unsafe' | 'fake' | 'other';
export type RideRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface RideDraft {
  kind: RideKind;
  /** The village from the villages list (or typed) */
  fromVillage: string;
  /** Free text: المنصورة، الجامعة، موقف القاهرة… */
  toPlace: string;
  /** "07:30" */
  departTime: string;
  /** "15:00", or '' when there is no way back */
  returnTime: string;
  schedule: RideSchedule;
  /** 0 = Sunday … 6 = Saturday, only for schedule 'days' */
  days: number[];
  /** "2026-11-07", only for schedule 'once' */
  rideDate: string;
  /** car: free seats; taxi: how many people are wanted */
  seats: number;
  /** Pounds per seat. car: the token price (0 = free); taxi: the expected share, null = split equally */
  price: number | null;
  carType: string;
  notes: string;
  riders: RideRiders;
  phone: string;
  whatsapp: boolean;
}

export interface Ride extends RideDraft {
  id: string;
  ownerId: string;
  /** First two names of the poster, filled in by the database */
  ownerName: string;
  /** Seats held by accepted requests */
  seatsTaken: number;
  status: RideStatus;
  reportsCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RideRequest {
  id: string;
  rideId: string;
  requesterId: string;
  requesterName: string;
  phone: string;
  seats: number;
  note: string;
  status: RideRequestStatus;
  createdAt: string;
  updatedAt: string;
  /** The trip, when the list was asked for with it (the requester's own list) */
  ride?: Ride | null;
}

export interface RideRepo {
  /** Live posts: active and not ended */
  listPublic(): Promise<Ride[]>;
  /** One post: live ones for everyone, any of your own, the ones you asked to join, all for admins */
  get(id: string): Promise<Ride | null>;
  listMine(ownerId: string): Promise<Ride[]>;
  create(ownerId: string, draft: RideDraft): Promise<Ride>;
  update(id: string, draft: RideDraft): Promise<Ride>;
  /** Pause (stop showing) or show again */
  setPaused(id: string, paused: boolean): Promise<Ride>;
  /** Another 30 days, in the last 7 */
  renew(id: string): Promise<Ride>;
  remove(id: string): Promise<void>;
  report(id: string, reason: RideReportReason, note: string): Promise<void>;

  /** "عايز أنضم" */
  requestJoin(rideId: string, seats: number, phone: string, note: string): Promise<RideRequest>;
  /** Your own request on this post, if any */
  myRequest(rideId: string, userId: string): Promise<RideRequest | null>;
  /** Requests on the posts you own, newest first */
  requestsOnMyRides(ownerId: string): Promise<RideRequest[]>;
  /** The requests you sent, with their trips */
  myRequests(userId: string): Promise<RideRequest[]>;
  respond(requestId: string, accept: boolean): Promise<RideRequest>;
  cancelRequest(requestId: string): Promise<RideRequest>;

  /** Admin: posts hidden by reports */
  listHidden(): Promise<Ride[]>;
  /** Admin: show a hidden post again (clears its reports) */
  restore(id: string): Promise<Ride>;
}
