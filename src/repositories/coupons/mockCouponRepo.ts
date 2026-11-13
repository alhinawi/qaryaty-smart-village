// ─── Demo mode (no backend): coupons live on this device, with the same rules as the database
import type { Coupon, CouponDraft, MyCoupon } from '@/utils/coupons';
import { couponEffect, couponProblem, normalizeCouponCode } from '@/utils/coupons';
import { RepoError } from '../errors';
import type { AdminCoupon, CouponCheck, CouponDevice, CouponRepo } from './types';

const KEY = 'qaryati_coupons';

export const DEMO_COUPONS: Coupon[] = [
  {
    id: 1,
    code: 'QARYA1',
    title: 'أول طلب من غير رسوم',
    description: 'بتدفع تمن الحاجة أو الخدمة بس، ومفيش عمولة للتطبيق على أول طلب ليك.',
    kind: 'waive_fees',
    value: 0,
    maxDiscount: null,
    minOrder: 0,
    appliesTo: 'both',
    shopId: null,
    firstOrderOnly: true,
    perUserLimit: 1,
    totalLimit: null,
    startsAt: null,
    endsAt: null,
    active: true,
    isPublic: true,
  },
];

function load(): Coupon[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Coupon[]) : DEMO_COUPONS;
  } catch {
    return DEMO_COUPONS;
  }
}

function store(list: Coupon[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode: keep it in memory only */
  }
}

const NO_DEVICE: CouponDevice = { signedIn: true, hasOrders: false, usedCodes: [] };

export function createMockCouponRepo(): CouponRepo {
  let last: CouponDevice = NO_DEVICE;
  return {
    async listMine(device) {
      const d = (last = device ?? last);
      return load()
        .filter((c) => c.isPublic)
        .map(
          (c): MyCoupon => ({
            ...c,
            usedByMe: d.usedCodes.filter((x) => x === c.code).length,
            soldOut: false,
            hasOrders: d.hasOrders,
          })
        );
    },

    async check(input): Promise<CouponCheck> {
      const code = normalizeCouponCode(input.code);
      const coupon = load().find((c) => c.code === code);
      if (!coupon) return { ok: false, message: 'الكود ده مش صحيح' };
      const d = (last = input.device ?? last);
      const problem = couponProblem(coupon, input, {
        signedIn: d.signedIn,
        hasOrders: d.hasOrders,
        usedByMe: d.usedCodes.filter((x) => x === code).length,
        soldOut: false,
      });
      if (problem) return { ok: false, message: problem };
      return { ok: true, coupon, effect: couponEffect(coupon, input) };
    },

    async listAll() {
      const used = last.usedCodes;
      return load().map(
        (c): AdminCoupon => {
          const uses = used.filter((x) => x === c.code).length;
          return { ...c, uses, users: uses > 0 ? 1 : 0, saved: 0, lastUsedAt: null };
        }
      );
    },

    async save(draft: CouponDraft, id?: number) {
      const list = load();
      const code = normalizeCouponCode(draft.code);
      if (list.some((c) => c.code === code && c.id !== id)) {
        throw new RepoError('rejected', 'فيه كوبون تاني بنفس الكود ده');
      }
      if (id == null) {
        const next = Math.max(0, ...list.map((c) => c.id)) + 1;
        store([...list, { ...draft, code, id: next }]);
      } else {
        store(list.map((c) => (c.id === id ? { ...draft, code, id } : c)));
      }
    },

    async setActive(id, active) {
      store(load().map((c) => (c.id === id ? { ...c, active } : c)));
    },
  };
}
