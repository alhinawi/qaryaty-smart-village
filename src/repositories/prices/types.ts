/** Informational merchant announcements, never checkout-price overrides. */
export interface DailyPrice {
  id: string; shopId: number; shopName: string; item: string; unit: string;
  price: number; updatedAt: string;
}
export interface PriceDraft { item: string; unit: string; price: number }
export interface PricesRepo {
  list(shopId?: number): Promise<DailyPrice[]>;
  publish(shopId: number, draft: PriceDraft): Promise<void>;
  withdraw(id: string): Promise<void>;
}
