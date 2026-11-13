// ─── قسايم (coupons): data access
import type { Coupon, CouponDraft, CouponEffect, MyCoupon, OrderMoney } from '@/utils/coupons';

/** Demo mode only (no backend): what this device already did. Supabase checks the account itself. */
export interface CouponDevice {
  signedIn: boolean;
  hasOrders: boolean;
  usedCodes: string[];
}

export interface CouponCheckInput extends OrderMoney {
  code: string;
  device?: CouponDevice;
}

export type CouponCheck =
  | { ok: true; coupon: Coupon; effect: CouponEffect }
  | { ok: false; message: string };

/** A coupon in the admin list, with how much it was used. */
export interface AdminCoupon extends Coupon {
  uses: number;
  users: number;
  /** Everything it saved customers, in EGP. */
  saved: number;
  lastUsedAt: string | null;
}

export interface CouponRepo {
  /** The coupons on قسايمي, with what this person did with each. */
  listMine(device?: CouponDevice): Promise<MyCoupon[]>;
  /** Checks a code against one order. The database checks it again when the order is saved. */
  check(input: CouponCheckInput): Promise<CouponCheck>;
  /** Admin: every coupon with its use. */
  listAll(): Promise<AdminCoupon[]>;
  /** Admin: create (no id) or edit a coupon. */
  save(draft: CouponDraft, id?: number): Promise<void>;
  /** Admin: turn a coupon on or off. */
  setActive(id: number, active: boolean): Promise<void>;
}
