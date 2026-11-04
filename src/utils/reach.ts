// ─── Who shows to whom, by village and by how they work
// The main lists (مدرسين القرية، سباك، ممرضة…) show people who come in person and live in
// the user's village, or a nearby one when "اعرض القرى القريبة كمان" is on.
// The أونلاين tab shows everyone who works online, from anywhere.
// So a teacher in a far village who teaches only in person never shows.
import type { Provider, ProviderMode } from '@/types';
import { nearbyVillages } from '@/data/villages';

export interface Reach {
  village: string;
  includeNearby: boolean;
}

export const IN_PERSON_MODES: ProviderMode[] = ['home', 'teacher_home', 'center', 'clinic'];

export function worksInPerson(provider: Pick<Provider, 'modes'>): boolean {
  return provider.modes.some((mode) => IN_PERSON_MODES.includes(mode));
}

export function worksOnline(provider: Pick<Provider, 'modes'>): boolean {
  return provider.modes.includes('online');
}

/** The user's village, plus its neighbours when they asked for them. */
export function villagesInReach(reach: Reach): Set<string> {
  return new Set([reach.village, ...(reach.includeNearby ? nearbyVillages(reach.village) : [])]);
}

export function isInReach(village: string, reach: Reach): boolean {
  return villagesInReach(reach).has(village);
}

/** Comes in person and lives close enough: the main lists. */
export function isLocalProvider(provider: Provider, reach: Reach): boolean {
  return worksInPerson(provider) && isInReach(provider.village, reach);
}

export function localProviders(providers: Provider[], reach: Reach): Provider[] {
  const villages = villagesInReach(reach);
  return providers.filter((p) => worksInPerson(p) && villages.has(p.village));
}

/** Everyone who works online, wherever they live: the أونلاين tab. */
export function onlineProviders(providers: Provider[]): Provider[] {
  return providers.filter(worksOnline);
}
