// ─── Core Types for Qaryati Application

export type ServiceCategory =
  | 'food'
  | 'delivery'
  | 'craft'
  | 'care'
  | 'edu'
  | 'health'
  | 'home';

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

/** A required choice the customer makes when ordering (ممرض/ممرضة, زيارة/عيادة…). */
export interface ServiceOption {
  id: string;
  label: string;
  choices: string[];
}

/** One answer to a ServiceOption, saved on the order. */
export interface SelectedOption {
  label: string;
  value: string;
}

// ─── Teachers
export type TeacherSubject =
  | 'arabic'
  | 'english'
  | 'math'
  | 'science'
  | 'history'
  | 'geography'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'french'
  | 'german'
  | 'quran'
  | 'computer';

export type SchoolStage = 'primary' | 'prep' | 'secondary';

// ─── Providers (teachers, nurses, babysitters, doctors, cleaners, and workers for every other service)
/** `worker`: anyone booked through an ordinary service (سباك، نجار، جزار…); `role` says what they do. */
export type ProviderKind = 'teacher' | 'nurse' | 'babysitter' | 'doctor' | 'cleaner' | 'worker';

/** Where the provider works: at the customer's home, online, or in a clinic. */
export type ProviderMode = 'home' | 'online' | 'clinic';

export type Gender = 'male' | 'female';

export interface Provider {
  id: number;
  kind: ProviderKind;
  /** The service this provider is booked through. */
  serviceId: number;
  name: string;
  gender: Gender;
  /** Fixed profile-photo URL (sample data). Falls back to initials if it fails. */
  photo: string;
  subject?: TeacherSubject;
  stages?: SchoolStage[];
  /** Doctors: specialty, e.g. باطنة. */
  specialty?: string;
  /** Workers: what they do, as shown on their card (سباك، كوافيرة، بيّاعة خضار). */
  role?: string;
  experienceYears: number;
  rating: number;
  reviews: number;
  price: string;
  numericPrice: number | null;
  priceType: PriceType;
  area: string;
  bio: string;
  modes: ProviderMode[];
  active: boolean;
}

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
  /** Teachers: the subject this service is for. */
  subject?: TeacherSubject;
  /** Choices the customer must make when ordering. */
  options?: ServiceOption[];
  /** Hidden from customers (set from the admin panel). */
  hidden?: boolean;
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
  /** Choices made in the order form (ممرض/ممرضة, المرحلة…). */
  options?: SelectedOption[];
  serviceId?: number;
  providerId?: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  address: string;
  village: string;
  rewardPoints: number;
  memberSince: string;
}

// ─── Auth
export type UserRole = 'customer' | 'admin';

/** A signed-in user as the (mock) auth service returns it. Never holds a password. */
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  village: string;
  address: string;
  role: UserRole;
  blocked: boolean;
  createdAt: string;
}

export interface AuthSession {
  /** Opaque token. Mock for now; a real API will issue and verify it. */
  token: string;
  user: AuthUser;
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
  /** Choices to make in the order form. */
  options?: ServiceOption[];
  /** Service the order is for (stats in the admin panel). */
  serviceId?: number;
  /** Provider booked, when ordering a specific teacher/nurse/doctor. */
  providerId?: number;
}

export interface OrderFormData {
  address: string;
  phone: string;
  notes: string;
  paymentMethod: PaymentMethod;
  discountCode: string;
}
