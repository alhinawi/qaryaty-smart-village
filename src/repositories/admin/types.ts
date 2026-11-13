// ─── Admin dashboard data (لوحة التحكم)
// Every call here is checked again on the server (public.is_admin() in the
// RPCs and RLS policies), so a non-admin gets an error, never data.

export type AdminOrderStatus = 'pending' | 'confirmed' | 'onway' | 'done' | 'cancelled';

export interface AdminMoney {
  orders: number;
  revenue: number;
  commission: number;
}

export interface AdminOverview {
  today: AdminMoney;
  week: AdminMoney;
  allTime: AdminMoney;
  /** Commission on orders that reached «done» */
  commissionDone: number;
  statusCounts: Record<AdminOrderStatus, number>;
  users: {
    total: number;
    today: number;
    week: number;
    admins: number;
    blocked: number;
  };
  pending: {
    orders: number;
    jobs: number;
    donations: number;
    marketHidden: number;
    /** Ride-share posts hidden after three reports */
    ridesHidden: number;
  };
  promo: { orders: number; feesWaived: number };
  villagesServed: number;
}

export interface AdminOrderItem {
  name: string;
  quantity: number;
  unit?: string;
  price?: number;
  emoji?: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: AdminOrderStatus;
  serviceName: string;
  serviceEmoji: string;
  phone: string;
  address: string;
  notes: string;
  paymentMethod: string;
  paymentStatus: string;
  items: AdminOrderItem[];
  subtotal: number | null;
  deliveryFee: number;
  commission: number | null;
  discount: number | null;
  discountCode: string | null;
  total: number | null;
  cancelReason: string | null;
  customerName: string;
  customerUsername: string;
  customerVillage: string;
}

export interface AdminOrderFilter {
  status?: AdminOrderStatus | '';
  /** ISO instants; `to` is exclusive */
  from?: string;
  to?: string;
  village?: string;
  search?: string;
}

export interface AdminShop {
  id: number;
  emoji: string;
  name: string;
  description: string;
  open: boolean;
  time: string;
  kind: string;
  photo: string | null;
  hidden: boolean;
  /** This shop's own delivery fee; null = the default */
  deliveryFee: number | null;
}

export interface AdminProduct {
  scope: string;
  productId: string;
  name: string;
  price: number;
  unit: string;
  emoji: string;
  section: string;
  photo: string | null;
  hidden: boolean;
}

export interface AdminService {
  id: number;
  cat: string;
  emoji: string;
  name: string;
  description: string;
  price: string;
  numericPrice: number | null;
  priceType: 'fixed' | 'from' | 'quote';
  hidden: boolean;
}

export interface AdminProvider {
  id: number;
  kind: string;
  serviceId: number;
  name: string;
  gender: 'male' | 'female';
  photo: string | null;
  price: string;
  numericPrice: number | null;
  priceType: 'fixed' | 'from' | 'quote';
  village: string;
  bio: string;
  active: boolean;
}

export type DonationStatus = 'new' | 'contacted' | 'done' | 'cancelled';

export interface AdminDonation {
  id: string;
  createdAt: string;
  donorName: string;
  phone: string;
  causeName: string;
  donationType: string;
  notes: string;
  status: DonationStatus;
  adminNote: string;
}

export interface AdminVillage {
  id: number;
  name: string;
  markaz: string;
  governorate: string;
  served: boolean;
  /** A farther village's delivery fee; null = none (the shop's fee applies) */
  deliveryFee: number | null;
}

export type PhotoFolder = 'shops' | 'products' | 'providers';

export interface AdminRepo {
  overview(): Promise<AdminOverview>;
  listOrders(filter: AdminOrderFilter): Promise<AdminOrder[]>;
  setOrderStatus(id: string, status: AdminOrderStatus, reason?: string): Promise<void>;

  listShops(): Promise<AdminShop[]>;
  saveShop(shop: Omit<AdminShop, 'id'> & { id?: number }): Promise<AdminShop>;
  listProducts(scope: string): Promise<AdminProduct[]>;
  saveProduct(product: AdminProduct, isNew: boolean): Promise<void>;
  listServices(): Promise<AdminService[]>;
  saveService(service: Omit<AdminService, 'id'> & { id?: number }): Promise<void>;
  listProviders(): Promise<AdminProvider[]>;
  saveProvider(provider: Omit<AdminProvider, 'id'> & { id?: number }): Promise<void>;
  /** Uploads to the public catalog-photos bucket and returns its public URL */
  uploadPhoto(folder: PhotoFolder, file: Blob): Promise<string>;

  listDonations(): Promise<AdminDonation[]>;
  setDonation(id: string, status: DonationStatus, adminNote: string): Promise<void>;

  /** Served villages when the search is empty, else matches by name */
  listVillages(search: string): Promise<AdminVillage[]>;
  setVillageServed(id: number, served: boolean): Promise<void>;
  setVillageDeliveryFee(id: number, fee: number | null): Promise<void>;

  /** app_settings delivery_fee_default */
  getDefaultDeliveryFee(): Promise<number>;
  setDefaultDeliveryFee(fee: number): Promise<void>;
}
