// ─── Offers on this device (demo backend) + one labeled sample offer
import { isTrackingDemoMode } from '@/config/demoMode';
import { demoOffers } from './demoOffers';
import { SHOPS } from '@/data/shops';
import { isOfferActive } from '@/utils/countdown';
import type { DailyOffer, OffersRepo } from './types';

const PHOTO_BY_SHOP = new Map(SHOPS.map((shop) => [shop.id, shop.photo]));

/** Cards show the shop's real photo when the shop exists in the catalog. */
function withPhoto(offer: DailyOffer): DailyOffer {
  const photo = PHOTO_BY_SHOP.get(offer.shopId);
  return photo ? { ...offer, shopPhoto: photo } : offer;
}

const KEY = 'qaryati_mock_offers';

/** The sample offer is simulated content: it shows only after a verified
 * read confirmed demo mode, and stays hidden when the setting is unknown. */
function sampleOffer(): DailyOffer | null {
  if (!isTrackingDemoMode()) return null;
  return {
    id: 'demo-offer-1',
    shopId: 101,
    shopName: 'فول وطعمية الحاج سيد',
    title: 'خصم20% على ساندوتش الفول',
    productId:'fool',percentOff:20,startsAt:new Date().toISOString(),
    details: 'العرض شغال لحد ما الوقت يخلص',
    endsAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
}


function load(scope:string): DailyOffer[] {
  try {
    return (JSON.parse(localStorage.getItem(`${KEY}:${scope}`) ?? '[]') as DailyOffer[]).filter((o) => isOfferActive(o.endsAt));
  } catch {
    return [];
  }
}

function save(scope:string,list: DailyOffer[]): void {
  try {
    localStorage.setItem(`${KEY}:${scope}`, JSON.stringify(list));
  } catch {
    /* private mode */
  }
}

export function createLocalOffersRepo(scope='guest'): OffersRepo {
  return {
    async listActive() {
      if (!isTrackingDemoMode()) return [];
      const mine = load(scope).map(row => ({ ...row, demo: true }));
      const all = [...demoOffers().filter(sample => !mine.some(row => row.shopId === sample.shopId)), ...mine];

      return all.sort((a, b) => a.endsAt.localeCompare(b.endsAt)).map(withPhoto);
    },
    async mineForShop(shopId) {
      if(!isTrackingDemoMode())return null;
      const sample=sampleOffer();
      const mine = load(scope).find((o) => o.shopId === shopId) ?? (sample?.shopId===shopId?sample:null);
      return mine ? withPhoto(mine) : null;
    },
    async create(shopId, shopName, title, details, hours, discount) {
      if(!isTrackingDemoMode())throw new Error("تسجيل العروض المحلية متاح في وضع التجربة بس");
      const offer: DailyOffer = {
        id: `offer_${Date.now()}`,
        ...(discount ? {...discount,startsAt:new Date().toISOString()} : {}),
        shopId,
        shopName,
        title: title.trim(),
        details: details.trim(),
        endsAt: new Date(Date.now() + hours * 3600_000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      // One active offer per shop: a new one replaces the old
      save(scope,[...load(scope).filter((o) => o.shopId !== shopId), offer]);
      return offer;
    },
    async stop(offerId) {
      save(scope,load(scope).filter((o) => o.id !== offerId));
    },
  };
}
