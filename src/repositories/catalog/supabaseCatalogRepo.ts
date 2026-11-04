// ─── Catalog from Supabase tables (see supabase/schema.sql)
// Columns are snake_case in the database and mapped to the app types here.
import type {
  BadgeType,
  Gender,
  PriceType,
  Provider,
  ProviderKind,
  ProviderMode,
  SchoolStage,
  Service,
  ServiceCategory,
  ServiceOption,
  Shop,
  TeacherSubject,
} from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogRepo } from './types';

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
}

export interface ShopRow {
  id: number;
  emoji: string;
  name: string;
  description: string;
  open: boolean;
  time: string;
  bg_color: string;
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
  experience_years: number;
  rating: number;
  reviews: number;
  price: string;
  numeric_price: number | null;
  price_type: PriceType;
  area: string;
  bio: string;
  modes: ProviderMode[];
  active: boolean;
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
  };
}

export function shopFromRow(row: ShopRow): Shop {
  return {
    id: row.id,
    emoji: row.emoji,
    name: row.name,
    description: row.description,
    open: row.open,
    time: row.time,
    bgColor: row.bg_color,
  };
}

export function providerFromRow(row: ProviderRow): Provider {
  return {
    id: row.id,
    kind: row.kind,
    serviceId: row.service_id,
    name: row.name,
    gender: row.gender,
    photo: row.photo ?? '',
    subject: row.subject ?? undefined,
    stages: row.stages?.length ? row.stages : undefined,
    specialty: row.specialty ?? undefined,
    experienceYears: row.experience_years,
    rating: Number(row.rating),
    reviews: row.reviews,
    price: row.price,
    numericPrice: row.numeric_price == null ? null : Number(row.numeric_price),
    priceType: row.price_type,
    area: row.area,
    bio: row.bio,
    modes: row.modes ?? [],
    active: row.active,
  };
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
      return (data as ShopRow[]).map(shopFromRow);
    },
    async getProviders() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('providers').select('*').eq('active', true).order('id');
      if (error) throw error;
      return (data as ProviderRow[]).map(providerFromRow);
    },
  };
}
