// ─── عروض اليوم: a merchant sets a time-limited offer, customers see it with
// a countdown, and it disappears by itself when time runs out.
export interface DailyOffer {
  id: string;
  shopId: number;
  shopName: string;
  /** Shop photo URL when known; cards fall back to the shop's initial. */
  shopPhoto?: string;
  /** e.g. «خصم 20% على الغدا» */
  title: string;
  /** Optional line, e.g. «على كل الأكل لحد ما العرض يخلص» */
  details: string;
  /** ISO time the offer ends; the card auto-hides after it. */
  endsAt: string;
  createdAt: string;
  productId?: string;
  percentOff?: number;
  startsAt?: string;
}

export interface OffersRepo {
  /** Active, unexpired offers, nearest end first. */
  listActive(): Promise<DailyOffer[]>;
  /** The shop's current offer, if any (merchant side). */
  mineForShop(shopId: number): Promise<DailyOffer | null>;
  create(shopId: number, shopName: string, title: string, details: string, hours: number, discount?: {productId:string;percentOff:number}): Promise<DailyOffer>;
  /** Merchant stops the offer early. */
  stop(offerId: string): Promise<void>;
}
