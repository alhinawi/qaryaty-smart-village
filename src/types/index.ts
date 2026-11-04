// ─── Core Types for Qaryati Application

export type ServiceCategory =
  | 'food'
  | 'delivery'
  | 'craft'
  | 'care'
  | 'edu'
  | 'health'
  | 'home'
  | 'finishing';

/** The home page's category chips: every service category, plus المطاعم. */
export type CategoryFilter = 'all' | ServiceCategory | 'restaurants';

export type BadgeType = 'popular' | 'new' | '';

export type OrderStatus = 'pending' | 'confirmed' | 'onway' | 'done';

/**
 * cash: on delivery. card / wallet: online through Paymob (Visa, Meeza;
 * Vodafone Cash and other wallets). vodafone / instapay: manual transfers,
 * kept for old orders only.
 */
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'vodafone' | 'instapay';

/** Only the Paymob webhook moves this past 'pending', after it checks the HMAC. */
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';

/** One cart line as the server needs it: it looks up the name and price itself. */
export interface OrderItem {
  productId: string;
  quantity: number;
  grill?: boolean;
}

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
  /** Asked only when another option has this answer (fish type only for "buy and grill"). */
  showWhen?: { optionId: string; choice: string };
  /** Added to the price per unit when this choice is picked (the fish's price per kilo). */
  choicePrices?: Record<string, number>;
  /** Picking one of these choices sets the price instead (معاينة الأول, ابدأ الشغل). */
  prices?: Record<string, ChoicePrice>;
}

/** What a choice costs when picking it replaces the price (معاينة 100 ج). */
export interface ChoicePrice {
  /** null: set after confirmation. */
  price: number | null;
  priceType?: PriceType;
  /** Shown as the service price, e.g. "معاينة 100 ج". */
  label?: string;
}

/**
 * How much of a service the customer orders, and in what unit. Services
 * without one are ordered once, with no quantity box.
 */
export interface QuantityRule {
  /** 'ساعة', 'كيلو', 'شهر'… */
  unit: string;
  min: number;
  max: number;
  step: number;
  /** The unit (and price per unit) follow a choice: private lesson per hour, group per month. */
  byChoice?: {
    optionId: string;
    variants: Record<string, { unit: string; price?: number; priceLabel?: string }>;
  };
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
/**
 * Where the work happens. home: at the customer's home. teacher_home: at the teacher's home.
 * center: in a centre (سنتر). clinic: at the clinic. online: over the internet, from anywhere.
 */
export type ProviderMode = 'home' | 'teacher_home' | 'center' | 'online' | 'clinic';

export type Gender = 'male' | 'female';

/** A teacher's group class: who it is for, when it meets, where, and the monthly fee. */
export interface TeacherGroup {
  /** Unique for the teacher, e.g. "g1". */
  id: string;
  stage: SchoolStage;
  /** Days it meets, e.g. ['السبت', 'التلات']. */
  days: string[];
  /** Start time as people say it, e.g. "5:00 م". */
  time: string;
  /** Length of one class in minutes. */
  minutes: number;
  mode: Extract<ProviderMode, 'center' | 'teacher_home' | 'online'>;
  /** Places still free in the group. */
  seatsLeft: number;
  /** What one student pays per month. */
  monthlyPrice: number;
}

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
  /** Street or part of the village, e.g. الحي الغربي. */
  area: string;
  /** The village (or city) they live in, e.g. منية سندوب. */
  village: string;
  bio: string;
  modes: ProviderMode[];
  active: boolean;
  /** Teachers: what each student pays in a group lesson (the private price is numericPrice). */
  /** Teachers: the group classes you can join, each with its own schedule. */
  groups?: TeacherGroup[];
  groupPrice?: number;
  /** What an inspection visit (معاينة) costs; 0 is free. Only trades that offer one. */
  inspectionFee?: number;
  /** Delivered goods (a gas cylinder): the delivery fee on top of the price. */
  deliveryFee?: number;
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
  /** Quantity box with its unit; missing means one of it. */
  quantity?: QuantityRule;
  /** Hidden from customers (set from the admin panel). */
  hidden?: boolean;
  /** Other words people search with (انبوبة، بوتاجاز، نقاشة). */
  keywords?: string[];
}

/** What a shop does; shops with a product list open it instead of a free-text order. */
export type ShopKind =
  | 'grocery'
  | 'bakery'
  | 'veg'
  | 'fruit'
  | 'fish'
  | 'pharmacy'
  | 'butcher'
  | 'poultry'
  | 'sweets'
  | 'attar'
  | 'coffee'
  | 'dairy'
  | 'stationery'
  | 'housewares'
  | 'restaurant'
  | 'other';

export type FoodType =
  | 'fool'
  | 'hawawshi'
  | 'kofta'
  | 'koshary'
  | 'pizza'
  | 'seafood'
  | 'shawarma'
  | 'chicken'
  | 'liver'
  | 'feteer'
  | 'grills'
  | 'duck'
  | 'sweets'
  | 'juice'
  | 'breakfast';

/** Something a shop or restaurant sells, with its own price and unit. */
export interface Product {
  id: string;
  name: string;
  emoji: string;
  /** Photo URL; the emoji shows when it's missing or fails to load. */
  photo?: string;
  price: number;
  /** 'كيلو', 'قطعة', 'حزمة', 'طبق'… */
  unit: string;
  /** Kilos can be ordered in halves. */
  step: number;
  /** Section inside a menu ('سندوتشات', 'أطباق'). */
  section?: string;
  /** Fish: can also be grilled for an extra price per kilo. */
  grillable?: boolean;
  /** Medicine sold only with a prescription; the pharmacist checks it before delivery. */
  rx?: boolean;
}

export interface Shop {
  id: number;
  emoji: string;
  name: string;
  description: string;
  open: boolean;
  time: string;
  bgColor: string;
  kind?: ShopKind;
  /** Restaurants: what they serve, for the food-type filter. */
  foodTypes?: FoodType[];
  /** Restaurants: a photo of one of their dishes, for the card. */
  photo?: string;
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
  /** In `unit`s; whole numbers unless `step` is a half. */
  quantity: number;
  /** Shows the quantity box ('كيلو', 'ساعة'…); missing means one of it. */
  unit?: string;
  step?: number;
  photo?: string;
  /** The service or shop this line is from; the cart holds one at a time. */
  vendor?: { key: string; name: string };
  shopId?: number;
  /** The product's id in the shop's list; the server prices the order from it. */
  productId?: string;
  /** Fish bought and grilled. */
  grill?: boolean;
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
  /** What the customer pays, عمولة التطبيق included. null when the price is set after the provider confirms. */
  totalAmount: number | null;
  /** عمولة التطبيق in this order (the server sets its own value). */
  commissionAmount?: number;
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
  /** A cart order from one shop or restaurant. */
  shopId?: number;
  items?: OrderItem[];
  paymentStatus?: PaymentStatus;
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
  /** Public handle, lowercase a-z 0-9 _. Empty for accounts made before usernames. */
  username: string;
  /** Sign-in address. Supabase sends the activation email here. */
  email: string;
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
  /** Quantity box and its unit. */
  quantity?: QuantityRule;
  /** Service the order is for (stats in the admin panel). */
  serviceId?: number;
  /** Provider booked, when ordering a specific teacher/nurse/doctor. */
  providerId?: number;
  /** Added once on top of the price, e.g. delivering a gas cylinder. */
  deliveryFee?: number;
  /** Choices already made before the form opens (the group picked on the teacher's card). */
  preselected?: Record<string, string>;
}

export interface OrderFormData {
  address: string;
  phone: string;
  notes: string;
  paymentMethod: PaymentMethod;
  discountCode: string;
}

// ─── Shared rides (مشاوير مشتركة)
/**
 * car_seats: someone with a car takes people along their way.
 * taxi_split: people split a taxi fare.
 * private_share: people share a private car (ملاكي), e.g. coworkers taking turns or splitting costs.
 */
export type RideType = 'car_seats' | 'taxi_split' | 'private_share';

/** Saturday first, like the Egyptian week. */
export type Weekday = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export interface Ride {
  id: string;
  type: RideType;
  from: string;
  to: string;
  /** Leaving time, 24h "HH:MM". */
  time: string;
  /** Coming back, 24h "HH:MM", when the trip has a way back. */
  returnTime?: string;
  /** Days it repeats every week. Empty means one time, on `date`. */
  days: Weekday[];
  /** One-time trips: the date, YYYY-MM-DD. */
  date?: string;
  seatsTotal: number;
  seatsTaken: number;
  /** What each person pays, in pounds. */
  pricePerSeat: number;
  hostName: string;
  hostGender: Gender;
  hostPhoto: string;
  hostRating: number;
  hostTrips: number;
  /** The car, e.g. "فيرنا فضي". */
  car?: string;
  /** Only women can join. */
  womenOnly?: boolean;
  notes?: string;
  /** Posted by this user (from this device). */
  mine?: boolean;
}

export interface NewRideInput {
  type: RideType;
  from: string;
  to: string;
  time: string;
  returnTime?: string;
  days: Weekday[];
  date?: string;
  seatsTotal: number;
  pricePerSeat: number;
  hostName: string;
  hostGender: Gender;
  phone: string;
  car?: string;
  womenOnly?: boolean;
  notes?: string;
}

export interface SeatRequestInput {
  rideId: string;
  name: string;
  phone: string;
  seats: number;
  /** Where to pick them up, if not the start. */
  pickup?: string;
  note?: string;
}

/** pending: the driver confirms (car_seats). joined: taxi / ملاكي groups, you're in. */
export type SeatRequestStatus = 'pending' | 'joined';

export interface SeatRequest extends SeatRequestInput {
  id: string;
  status: SeatRequestStatus;
  createdAt: string;
}
