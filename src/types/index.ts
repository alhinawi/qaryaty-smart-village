// ─── Types

export type ServiceCategory = 'food' | 'delivery' | 'craft' | 'care' | 'edu';

export type CategoryFilter = 'all' | ServiceCategory;

export type BadgeType = 'popular' | 'new' | '';

export type PaymentMethod = 'cash' | 'vodafone' | 'instapay';

export interface Service {
  id: number;
  cat: ServiceCategory;
  emoji: string;
  name: string;
  desc: string;
  time: string;
  price: string;
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

export interface OrderModalData {
  emoji: string;
  name: string;
  desc: string;
}

export interface OrderFormData {
  address: string;
  phone: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

export interface FeatureItem {
  id: number;
  icon: string;
  title: string;
  description: string;
}
