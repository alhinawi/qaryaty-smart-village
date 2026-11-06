// ─── بيع المستعمل وتبادل: the shapes the pages and the repository share

export type ListingKind = 'sale' | 'swap';
export type ListingCategory =
  | 'devices' | 'phones' | 'furniture' | 'clothes' | 'vehicles' | 'tools' | 'books' | 'kids' | 'other';
export type ListingCondition = 'new' | 'good' | 'used';
export type ListingStatus = 'active' | 'sold' | 'swapped' | 'hidden';
export type ListingReportReason = 'scam' | 'fake' | 'prohibited' | 'sold' | 'other';

export interface MarketListing {
  id: string;
  ownerId: string;
  /** First name (and second) of the owner, copied when the post is made */
  ownerName: string;
  kind: ListingKind;
  title: string;
  category: ListingCategory;
  condition: ListingCondition;
  village: string;
  description: string;
  /** Pounds; null for a swap */
  price: number | null;
  negotiable: boolean;
  /** What a swap wants in exchange; '' for a sale */
  wanted: string;
  /** Public photo URLs, first is the cover */
  photos: string[];
  /** Bucket paths of the same photos (<owner id>/<name>.jpg) */
  photoPaths: string[];
  /** Shown only when the owner chose to show it */
  contactPhone: string | null;
  status: ListingStatus;
  reportsCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface ListingDraft {
  kind: ListingKind;
  title: string;
  category: ListingCategory | '';
  condition: ListingCondition | '';
  village: string;
  description: string;
  price: number | null;
  negotiable: boolean;
  wanted: string;
  /** Bucket paths, already uploaded */
  photos: string[];
  showPhone: boolean;
  contactPhone: string;
}

export interface MarketMessage {
  id: string;
  listingId: string;
  buyerId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface MarketConversation {
  listingId: string;
  listingTitle: string;
  listingKind: ListingKind;
  listingPhoto: string | null;
  buyerId: string;
  otherName: string;
  iAmOwner: boolean;
  lastBody: string;
  lastAt: string;
  lastFromMe: boolean;
  unread: number;
}

export interface MarketRepo {
  /** Live posts of one kind, newest first (admins can ask for hidden ones) */
  list(kind: ListingKind, opts?: { hidden?: boolean }): Promise<MarketListing[]>;
  /** null when it doesn't exist or this person can't see it */
  get(id: string): Promise<MarketListing | null>;
  mine(): Promise<MarketListing[]>;
  create(draft: ListingDraft): Promise<MarketListing>;
  update(id: string, draft: ListingDraft): Promise<MarketListing>;
  setStatus(id: string, status: ListingStatus): Promise<MarketListing>;
  remove(listing: MarketListing): Promise<void>;
  renew(id: string): Promise<MarketListing>;
  report(id: string, reason: ListingReportReason, note: string): Promise<void>;
  /** Uploads one (already compressed) photo; returns its bucket path */
  uploadPhoto(userId: string, file: Blob): Promise<string>;
  deletePhotos(paths: string[]): Promise<void>;
  photoUrl(path: string): string;
  thread(listingId: string, buyerId: string): Promise<MarketMessage[]>;
  send(listingId: string, buyerId: string, body: string): Promise<MarketMessage>;
  markRead(listingId: string, buyerId: string): Promise<void>;
  conversations(): Promise<MarketConversation[]>;
}
