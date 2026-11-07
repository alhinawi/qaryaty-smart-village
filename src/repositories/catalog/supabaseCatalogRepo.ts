import { appendIllustrativeShops } from '@/data/illustrativeShops';
import { appendDemoPharmacies, demoPharmacyMenu } from '@/data/demoPharmacies';
import { PHARMACY } from '@/data/catalog';
import { catalogProductPhoto } from '@/config/catalogImages';
import { PROVIDERS } from '@/data/providers';
import { withProviderPortrait } from '@/config/providerImages';
import { pharmacyProductPhoto } from '@/config/pharmacyImages';
import { shopPresentation } from '@/config/shopPresentation';
import { restaurantPresentation } from '@/config/restaurantPresentation';
// ─── Catalog from Supabase tables (see supabase/schema.sql)
// Columns are snake_case in the database and mapped to the app types here.
import type {
  BadgeType,
  Gender,
  PriceType,
  Product,
  Provider,
  ProviderKind,
  ProviderMode,
  QuantityRule,
  SchoolStage,
  Service,
  ServiceCategory,
  ServiceOption,
  Shop,
  TeacherGroup,
  TeacherSubject,
} from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogRepo, NewProviderInput, NewShopInput } from './types';

export interface ServiceRow {
  id: number;
  cat: ServiceCategory;
  emoji: string;
  name: string;
  description: string;
  time: string;
  price: string;
  numeric_price: number | null;
  price_type: PriceType;
  rating: string;
  badge: BadgeType | null;
  featured: boolean;
  subject: TeacherSubject | null;
  options: ServiceOption[] | null;
  hidden: boolean;
  keywords?: string[] | null;
  quantity?: QuantityRule | null;
}

export interface ShopRow {
  id: number;
  emoji: string;
  name: string;
  description: string;
  open: boolean;
  time: string;
  bg_color: string;
  kind?: string | null;
  food_types?: string[] | null;
  photo?: string | null;
  rating?: number | string | null;
  delivery_time?: string | null;
  village?: string | null;
}

export interface CatalogProductRow {
  scope: string;
  product_id: string;
  name: string;
  price: number | string;
  unit: string;
  step: number | string;
  grillable: boolean;
  rx: boolean;
  emoji?: string | null;
  section?: string | null;
  photo?: string | null;
  position?: number | null;
}

/** Same rule as public.shop_scope(): a restaurant has its own menu, other shops share their kind's list. */
export function productScope(shop: Pick<Shop, 'id' | 'kind'>): string {
  return shop.kind === 'restaurant' ? `restaurant:${shop.id}` : (shop.kind ?? 'other');
}

export function productFromRow(row: CatalogProductRow): Product {
  const product: Product = {
    id: row.product_id,
    name: row.name,
    emoji: row.emoji || '🛍️',
    photo: row.photo ?? undefined,
    price: Number(row.price),
    unit: row.unit,
    step: Number(row.step),
    section: row.section || undefined,
    grillable: row.grillable || undefined,
    rx: row.rx || undefined,
  };
  return row.scope === 'pharmacy' ? pharmacyProductPhoto(product) : catalogProductPhoto(row.scope, product);
}

export interface ProviderRow {
  id: number;
  kind: ProviderKind;
  service_id: number;
  name: string;
  gender: Gender;
  photo: string | null;
  subject: TeacherSubject | null;
  stages: SchoolStage[] | null;
  specialty: string | null;
  role?: string | null;
  experience_years: number;
  rating: number;
  reviews: number;
  price: string;
  numeric_price: number | null;
  price_type: PriceType;
  area: string;
  village: string | null;
  bio: string;
  modes: ProviderMode[];
  active: boolean;
  group_price?: number | null;
  inspection_fee?: number | null;
  delivery_fee?: number | null;
  groups?: TeacherGroup[] | null;
}

export function serviceFromRow(row: ServiceRow): Service {
  return {
    id: row.id,
    cat: row.cat,
    emoji: row.emoji,
    name: row.name,
    desc: row.description,
    time: row.time,
    price: row.price,
    numericPrice: row.numeric_price == null ? null : Number(row.numeric_price),
    priceType: row.price_type,
    rating: row.rating,
    badge: row.badge ?? '',
    featured: row.featured,
    subject: row.subject ?? undefined,
    options: row.options?.length ? row.options : undefined,
    hidden: row.hidden,
    keywords: row.keywords?.length ? row.keywords : undefined,
    quantity: row.quantity ?? undefined,
  };
}

export function shopFromRow(row: ShopRow): Shop {
  return shopPresentation(restaurantPresentation({
    id: row.id,
    emoji: row.emoji,
    name: row.name,
    description: row.description,
    open: row.open,
    time: row.time,
    bgColor: row.bg_color,
    kind: (row.kind ?? 'other') as Shop['kind'],
    foodTypes: (row.food_types ?? []) as Shop['foodTypes'],
    photo: row.photo ?? undefined,
    rating: row.rating == null ? undefined : Number(row.rating),
    deliveryTime: row.delivery_time ?? undefined,
    village: row.village ?? undefined,
  }));
}

export function providerFromRow(row: ProviderRow): Provider {
  return withProviderPortrait({
    id: row.id,
    kind: row.kind,
    serviceId: row.service_id,
    name: row.name,
    gender: row.gender,
    photo: row.photo ?? '',
    subject: row.subject ?? undefined,
    stages: row.stages?.length ? row.stages : undefined,
    specialty: row.specialty ?? undefined,
    role: row.role ?? undefined,
    experienceYears: row.experience_years,
    rating: Number(row.rating),
    reviews: row.reviews,
    price: row.price,
    numericPrice: row.numeric_price == null ? null : Number(row.numeric_price),
    priceType: row.price_type,
    area: row.area,
    village: row.village ?? '',
    bio: row.bio,
    modes: row.modes ?? [],
    active: row.active,
    ...(row.group_price != null && { groupPrice: Number(row.group_price) }),
    ...(row.inspection_fee != null && { inspectionFee: Number(row.inspection_fee) }),
    ...(row.delivery_fee != null && { deliveryFee: Number(row.delivery_fee) }),
    ...(row.groups?.length && { groups: row.groups }),
  });
}

export function createSupabaseCatalogRepo(getClient: () => Promise<SupabaseClient>): CatalogRepo {
  return {
    async getServices() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('services').select('*').eq('hidden', false).order('id');
      if (error) throw error;
      return (data as ServiceRow[]).map(serviceFromRow);
    },
    async getShops() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('shops').select('*').order('id');
      if (error) throw error;
      return appendIllustrativeShops(appendDemoPharmacies((data as ShopRow[]).map(shopFromRow)));
    },
    async getProviders() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('providers').select('*').eq('active', true).order('id');
      if (error) throw error;
      const providers = (data as ProviderRow[]).map(providerFromRow);
      // Extra fictional demo caregivers are presentation-only; never overwrite live rows.
      return [...providers, ...PROVIDERS.filter(p => p.id >= 145 && p.id <= 147 && !providers.some(row => row.id === p.id))];
    },
    async getProducts(shop) {
      const demoMenu = demoPharmacyMenu(shop, PHARMACY);
      if (demoMenu) return demoMenu;
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('scope', productScope(shop))
        .order('position')
        .order('product_id');
      if (error) throw error;
      const rows = data as CatalogProductRow[];
      return rows.length > 0 ? rows.map(productFromRow) : null;
    },

    async addShop(input: NewShopInput) {
      const supabase = await getClient();
      // ids are assigned by the app (the column has no sequence)
      const { data: maxRow } = await supabase.from('shops').select('id').order('id', { ascending: false }).limit(1);
      const id = ((maxRow?.[0] as { id: number } | undefined)?.id ?? 0) + 1;
      const base = {
        id,
        name: input.name,
        kind: input.kind,
        emoji: input.emoji || '🏪',
        description: input.description,
        time: input.time ?? '',
        open: true,
        bg_color: '#ffffff',
      };
      // The owner link column arrives with the provider-accounts migration;
      // until then the insert retries without it.
      let { data, error } = await supabase
        .from('shops')
        .insert({ ...base, owner_profile_id: input.ownerProfileId ?? null })
        .select()
        .single();
      if (error && String(error.message).includes('owner_profile_id')) {
        ({ data, error } = await supabase.from('shops').insert(base).select().single());
      }
      if (error) throw error;
      return shopFromRow(data as ShopRow);
    },

    async addProvider(input: NewProviderInput) {
      const supabase = await getClient();
      const { data: maxRow } = await supabase.from('providers').select('id').order('id', { ascending: false }).limit(1);
      const id = ((maxRow?.[0] as { id: number } | undefined)?.id ?? 0) + 1;
      const base = {
        id,
        name: input.name,
        kind: input.kind,
        service_id: input.serviceId,
        gender: input.gender,
        role: input.role,
        village: input.village,
        area: input.area,
        price: input.price,
        price_type: 'quote',
        bio: input.bio,
        active: true,
      };
      let { data, error } = await supabase
        .from('providers')
        .insert({ ...base, owner_profile_id: input.ownerProfileId ?? null })
        .select()
        .single();
      if (error && String(error.message).includes('owner_profile_id')) {
        ({ data, error } = await supabase.from('providers').insert(base).select().single());
      }
      if (error) throw error;
      return providerFromRow(data as ProviderRow);
    },
  };
}
