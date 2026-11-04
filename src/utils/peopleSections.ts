// ─── People sections: every kind of person gets ONE place in the app
// Teachers live only in the "المدرسين" section, doctors and nurses only in "الدكاترة والتمريض",
// and so on. Their per-subject / per-kind services are not repeated as cards in the services grid.
import type {
  CategoryFilter,
  Provider,
  ProviderKind,
  SchoolStage,
  Service,
  ServiceCategory,
  TeacherSubject,
} from '@/types';
import { SUBJECT_LABELS } from '@/data/teachers';
import { providerRoleLabel } from '@/utils/people';
import { matchesSearch } from '@/utils/arabicSearch';

export interface PeopleSection {
  /** The category this section belongs to (one section per category). */
  id: ServiceCategory;
  emoji: string;
  title: string;
  kinds: ProviderKind[];
}

export const PEOPLE_SECTIONS: PeopleSection[] = [
  { id: 'edu', emoji: '👩‍🏫', title: 'المدرسين', kinds: ['teacher'] },
  { id: 'health', emoji: '🩺', title: 'الدكاترة والتمريض', kinds: ['doctor', 'nurse'] },
  { id: 'care', emoji: '🍼', title: 'جليسات الأطفال', kinds: ['babysitter'] },
  { id: 'home', emoji: '🧹', title: 'عمال وعاملات النظافة', kinds: ['cleaner'] },
];

/** Chip labels when a section has more than one kind (الدكاترة والتمريض). */
export const KIND_FILTER_LABELS: Record<ProviderKind, string> = {
  teacher: 'مدرسين',
  doctor: 'دكاترة',
  nurse: 'تمريض',
  babysitter: 'جليسات أطفال',
  cleaner: 'نظافة',
  worker: 'مقدمي خدمة',
};

export function sectionForCategory(category: CategoryFilter): PeopleSection | undefined {
  return PEOPLE_SECTIONS.find((section) => section.id === category);
}

export function sectionForKind(kind: ProviderKind): PeopleSection | undefined {
  return PEOPLE_SECTIONS.find((section) => section.kinds.includes(kind));
}

/**
 * Services that belong to a people section, so they are NOT shown in the services grid:
 * every teaching service (per subject, and the general "مدرس خصوصي") and every service
 * someone is booked through (تمريض، دكتور، جليسة، عاملة نظافة).
 */
export function peopleServiceIds(services: Service[], providers: Provider[]): Set<number> {
  const sectionKinds = new Set(PEOPLE_SECTIONS.flatMap((section) => section.kinds));
  const ids = new Set(
    providers.filter((provider) => sectionKinds.has(provider.kind)).map((provider) => provider.serviceId)
  );
  for (const service of services) if (service.cat === 'edu') ids.add(service.id);
  return new Set(services.filter((service) => ids.has(service.id)).map((service) => service.id));
}

/** The services grid without the services that live in a people section. */
export function gridServices(services: Service[], providers: Provider[]): Service[] {
  const people = peopleServiceIds(services, providers);
  return services.filter((service) => !people.has(service.id));
}

/**
 * "مش فارق معاك مين؟" requests for a section: order the general service and the village picks
 * someone. Teachers: the general service without a subject (مدرس خصوصي). Others: the service
 * the section's people are booked through.
 */
export function quickRequestServices(
  section: PeopleSection,
  services: Service[],
  providers: Provider[]
): Service[] {
  if (section.kinds.includes('teacher')) {
    return services.filter((service) => service.cat === section.id && !service.subject);
  }
  const ids = new Set(
    providers.filter((provider) => section.kinds.includes(provider.kind)).map((p) => p.serviceId)
  );
  return services.filter((service) => ids.has(service.id));
}

export interface ProviderFilters {
  kinds: ProviderKind[];
  kind?: ProviderKind | 'all';
  subject?: TeacherSubject | 'all';
  stage?: SchoolStage | 'all';
  query?: string;
}

/**
 * Active people of the given kinds, with the teacher filters and the search applied.
 * People whose service is hidden or missing (e.g. hidden from the admin panel) are left out,
 * since they could not be booked.
 */
export function filterProviders(
  providers: Provider[],
  services: Service[],
  { kinds, kind = 'all', subject = 'all', stage = 'all', query = '' }: ProviderFilters
): Provider[] {
  const bookable = new Set(services.map((service) => service.id));
  return providers.filter((provider) => {
    if (!provider.active || !kinds.includes(provider.kind)) return false;
    if (!bookable.has(provider.serviceId)) return false;
    if (kind !== 'all' && provider.kind !== kind) return false;
    if (provider.kind === 'teacher') {
      if (subject !== 'all' && provider.subject !== subject) return false;
      // No stages listed (e.g. Quran) means all ages
      if (stage !== 'all' && provider.stages && !provider.stages.includes(stage)) return false;
    }
    const subjectLabel = provider.subject ? SUBJECT_LABELS[provider.subject] : '';
    return matchesSearch(query, [
      provider.name,
      providerRoleLabel(provider),
      provider.bio,
      provider.area,
      subjectLabel,
      provider.specialty ?? '',
    ]);
  });
}

/**
 * People the customer can pick from for one service in the grid (سباك، نجار…), best rated first.
 * Empty when nobody is listed: the order then goes to whoever is available.
 */
export function providersForService(service: Service, providers: Provider[]): Provider[] {
  return providers
    .filter((provider) => provider.active && provider.serviceId === service.id)
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
}

/** How many bookable people each section has (for the section tiles on the home page). */
export function sectionCounts(providers: Provider[], services: Service[]): Record<ServiceCategory, number> {
  const counts = { food: 0, delivery: 0, craft: 0, care: 0, edu: 0, health: 0, home: 0 };
  for (const section of PEOPLE_SECTIONS) {
    counts[section.id] = filterProviders(providers, services, { kinds: section.kinds }).length;
  }
  return counts;
}
