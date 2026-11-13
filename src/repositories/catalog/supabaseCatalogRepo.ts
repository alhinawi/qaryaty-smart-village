import { creationDemoFlag } from '@/utils/contentProvenance';
import { appendIllustrativeRestaurantItems } from '@/data/restaurantMenuExtras';
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
import { RepoError } from '../errors';
import type { CatalogRepo, NewProviderInput, NewShopInput } from './types';

export interface ServiceRow {
  is_demo?: boolean;
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
  is_demo?: boolean;
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
  is_busy?: boolean | null;
  busy_until?: string | null;
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
  is_demo?: boolean;
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
    rating: row.is_demo === true ? row.rating : '',
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
    demo: row.is_demo === true,
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
    rating: row.is_demo === true && row.rating != null ? Number(row.rating) : undefined,
    deliveryTime: row.delivery_time ?? undefined,
    village: row.village ?? undefined,
    busy: row.is_busy ?? undefined,
    busyUntil: row.busy_until ?? undefined,
  }));
}

export function providerFromRow(row: ProviderRow): Provider {
  return withProviderPortrait({
    demo: row.is_demo === true,
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
    rating: row.is_demo === true ? Number(row.rating) : 0,
    reviews: row.is_demo === true ? row.reviews : 0,
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

export function createSupabaseCatalogRepo(
  getClient: () => Promise<SupabaseClient>,
  /** Demo content visible? Read at query time so the admin switch applies at once. */
  showDemo: () => boolean = () => true,
): CatalogRepo {
  async function aggregates(kind:string, ids:number[]) {
    try { const c=await getClient(); const {data,error}=await c.rpc('public_review_aggregates',{p_kind:kind,p_ids:ids}); if(error) return new Map<number,{average:number;count:number}>(); return new Map<number,{average:number;count:number}>((data??[]).map((r:{target_id:number;average:number;review_count:number})=>[Number(r.target_id),{average:Number(r.average),count:Number(r.review_count)}])); }
    catch { return new Map<number,{average:number;count:number}>(); } // Missing RPC/outage hides unverified stars, never preserves seeded values on real rows.
  }
  return {
    async getServices() {
      const supabase = await getClient();
      let query = supabase.from('services').select('*').eq('hidden', false);
      if (!showDemo()) query = query.eq('is_demo', false);
      const { data, error } = await query.order('id');
      if (error) throw error;
      const rows=data as ServiceRow[]; const ratings=await aggregates('service',rows.filter(r=>r.is_demo!==true).map(r=>r.id));
      return rows.map(row=>({...serviceFromRow(row),...(row.is_demo===true?{}:{rating:ratings.get(row.id)?.average.toFixed(1)??''})}));
    },
    async getShops() {
      const supabase = await getClient();
      let query = supabase.from('shops').select('*').eq('hidden', false);
      if (!showDemo()) query = query.eq('is_demo', false);
      const { data, error } = await query.order('id');
      if (error) throw error;
      const rows=data as ShopRow[]; const ratings=await aggregates('shop',rows.filter(r=>r.is_demo!==true).map(r=>r.id));
      const shops=rows.map(row=>({...shopFromRow(row),...(row.is_demo===true?{}:{rating:ratings.get(row.id)?.average})}));
      // Illustrative/demo shops are presentation-only; real mode never sees them.
      return showDemo() ? appendIllustrativeShops(appendDemoPharmacies(shops)) : shops;
    },
    async getProviders() {
      const supabase = await getClient();
      let query = supabase.from('providers').select('*').eq('active', true);
      if (!showDemo()) query = query.eq('is_demo', false);
      const { data, error } = await query.order('id');
      if (error) throw error;
      const rows=data as ProviderRow[]; const ratings=await aggregates('provider',rows.filter(r=>r.is_demo!==true).map(r=>r.id));
      const providers=rows.map(row=>({...providerFromRow(row),...(row.is_demo===true?{}:{rating:ratings.get(row.id)?.average??0,reviews:ratings.get(row.id)?.count??0})}));
      if (!showDemo()) return providers;
      // Extra fictional demo caregivers are presentation-only; never overwrite live rows.
      return [...providers, ...PROVIDERS.filter(p => p.id >= 145 && p.id <= 147 && !providers.some(row => row.id === p.id))];
    },
    async getProducts(shop) {
      if (showDemo()) {
        const demoMenu = demoPharmacyMenu(shop, PHARMACY);
        if (demoMenu) return demoMenu;
      }
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('scope', productScope(shop))
        .eq('hidden', false)
        .order('position')
        .order('product_id');
      if (error) throw error;
      const rows = data as CatalogProductRow[];
      if (rows.length === 0) return null;
      const products = rows.map(productFromRow);
      return showDemo() ? appendIllustrativeRestaurantItems(shop, products) : products;
    },

    async addShop(input: NewShopInput) {
      const demo = creationDemoFlag();
      const supabase = await getClient();
      // ids are assigned by the app (the column has no sequence)
      const { data: maxRow } = await supabase.from('shops').select('id').order('id', { ascending: false }).limit(1);
      const id = ((maxRow?.[0] as { id: number } | undefined)?.id ?? 0) + 1;
      const base = {
        is_demo: demo,
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
      const demo = creationDemoFlag();
      const supabase = await getClient();
      const { data: maxRow } = await supabase.from('providers').select('id').order('id', { ascending: false }).limit(1);
      const id = ((maxRow?.[0] as { id: number } | undefined)?.id ?? 0) + 1;
      const base = {
        is_demo: demo,
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

// ─── بيانات المحل (merchant dashboard): the merchant edits his own shop row
// (RLS: "shops: owner edits own"; staff keep the admin policies). Only the
// fields the dashboard actually changed go in the payload, so one edit never
// clobbers the rest of the row.
export interface ShopBasicsUpdate {
  open?: boolean;
  /** Customer-facing hours text ("⏰ 7ص - 12م"); isShopOpenNow reads it. */
  hours?: string;
  description?: string;
  busy?: boolean;
  /** ISO auto-end for busy; null = until the merchant clears it himself. */
  busyUntil?: string | null;
  photo?: string;
}

export function shopBasicsPayload(update: ShopBasicsUpdate): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (update.open !== undefined) payload.open = update.open;
  if (update.hours !== undefined) payload.time = update.hours;
  if (update.description !== undefined) payload.description = update.description;
  if (update.busy !== undefined) payload.is_busy = update.busy;
  if (update.busyUntil !== undefined) payload.busy_until = update.busyUntil;
  if (update.photo !== undefined) payload.photo = update.photo;
  return payload;
}

export async function updateShopBasics(
  getClient: () => Promise<SupabaseClient>,
  shopId: number,
  update: ShopBasicsUpdate,
): Promise<void> {
  const payload = shopBasicsPayload(update);
  if (Object.keys(payload).length === 0) return;
  const supabase = await getClient();
  const { error } = await supabase.from('shops').update(payload).eq('id', shopId);
  if (error) throw new RepoError('rejected', 'ماقدرناش نحفظ التعديل — محتاج صلاحية إدارة', { cause: error });
}
