// ─── Core Types for Qaryati Application

export type ServiceCategory = 'food' | 'delivery' | 'craft' | 'care' | 'edu';

export type CategoryFilter = 'all' | ServiceCategory;

export type BadgeType = 'popular' | 'new' | '';

export type OrderStatus = 'pending' | 'confirmed' | 'onway' | 'done';

export type PaymentMethod = 'cash' | 'vodafone' | 'instapay';

export type ActiveTab = 'home' | 'orders' | 'favorites' | 'messages' | 'profile';

export interface Service {
  id: number;
  cat: ServiceCategory;
  emoji: string;
  name: string;
  desc: string;
  time: string;
  price: string;
  numericPrice: number;
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
  totalAmount: number;
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
  numericPrice?: number;
}

export interface OrderFormData {
  address: string;
  phone: string;
  notes: string;
  paymentMethod: PaymentMethod;
  discountCode: string;
}
