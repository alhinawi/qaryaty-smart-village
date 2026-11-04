// ─── Core Types for Qaryati Application

export type ServiceCategory = 'food' | 'delivery' | 'craft' | 'care' | 'edu';

export type CategoryFilter = 'all' | ServiceCategory;

export type BadgeType = 'popular' | 'new' | '';

export type OrderStatus = 'pending' | 'confirmed' | 'onway' | 'done';

export type PaymentMethod = 'cash' | 'vodafone' | 'instapay';

/**
 * How a service is priced:
 * - fixed: numericPrice is the final price
 * - from:  numericPrice is a starting price; the provider confirms the final amount
 * - quote: no price until the provider confirms (numericPrice is null)
 */
export type PriceType = 'fixed' | 'from' | 'quote';

export type ActiveTab = 'home' | 'orders' | 'favorites' | 'messages' | 'profile';

export interface Service {
  id: number;
  cat: ServiceCategory;
  emoji: string;
  name: string;
  desc: string;
  time: string;
  price: string;
  numericPrice: number | null;
  priceType: PriceType;
  rating: string;
  badge: BadgeType;
  featured: boolean;
}

export interface Shop {
  id: number;
  emoji: string;
  name: string;
  description: string;
  open: boolean;
  time: string;
  bgColor: string;
}

export interface CategoryItem {
  id: CategoryFilter;
  label: string;
  emoji: string;
}

export interface FeatureItem {
  id: number;
  icon: string;
  title: string;
  description: string;
}

export interface CartItem {
  id: string;
  serviceId: number;
  name: string;
  price: number;
  formattedPrice: string;
  /** Optional so carts persisted before this field existed keep working (treated as 'fixed'). */
  priceType?: PriceType;
  emoji: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  serviceName: string;
  serviceEmoji: string;
  address: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  discountCode?: string;
  discountAmount: number;
  /** null when the price is set after the provider confirms. */
  totalAmount: number | null;
  /** true when totalAmount is a starting price, not the final amount. */
  isEstimate?: boolean;
  status: OrderStatus;
  createdAt: string;
  rating?: number;
  feedback?: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  address: string;
  village: string;
  rewardPoints: number;
  memberSince: string;
}

export interface Message {
  id: string;
  senderName: string;
  senderRole: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
  icon: string;
}

export interface OrderModalData {
  emoji: string;
  name: string;
  desc: string;
  price?: string;
  /** null or missing means the price is set after the provider confirms. */
  numericPrice?: number | null;
  priceType?: PriceType;
}

export interface OrderFormData {
  address: string;
  phone: string;
  notes: string;
  paymentMethod: PaymentMethod;
  discountCode: string;
}
