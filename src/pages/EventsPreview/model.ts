export const EVENT_TYPES = ['فرح', 'عزاء', 'عقيقة', 'خطوبة', 'مناسبة عائلية'] as const;
export const EVENT_SERVICES = [
  { id: 'catering', name: 'طباخ أو تجهيز الأكل', hint: 'وجبات الضيوف وتجهيزها' },
  { id: 'tent', name: 'خيمة وفراشة', hint: 'تجهيز المكان والتظليل' },
  { id: 'chairs', name: 'كراسي وترابيزات', hint: 'العدد حسب ضيوفك' },
  { id: 'photo', name: 'تصوير المناسبة', hint: 'صور أو فيديو حسب الاتفاق' },
  { id: 'delivery', name: 'نقل وتوصيل التجهيزات', hint: 'المسافة والحمولة حسب الاتفاق' },
] as const;
export type EventService = typeof EVENT_SERVICES[number]['id'];
export interface EventDraft { type: typeof EVENT_TYPES[number]; guests: number; date: string; time: string; place: string; services: EventService[]; note: string }
/** Only an explicit provider-owned event listing can supply an estimate.
 * No fuzzy mapping of ordinary restaurant/person pricing to event packages. */
export interface EventListing {
  id: string; providerId: number; providerName: string; service: EventService;
  amount: number; currency: 'EGP'; unit: 'guest' | 'event' | 'chair';
  updatedAt: string; expiresAt: string; ownerConfirmed: boolean; demo: boolean;
}
export function validEventDraft(draft: EventDraft): boolean {
  const parsed = new Date(`${draft.date}T00:00:00Z`);
  const realDate = Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === draft.date;
  return realDate && EVENT_TYPES.includes(draft.type) && Number.isInteger(draft.guests) && draft.guests >= 1 && draft.guests <= 2000 &&
    /^\d{4}-\d{2}-\d{2}$/.test(draft.date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time) &&
    draft.place.trim().length >= 3 && draft.place.length <= 200 && draft.note.length <= 1000 &&
    draft.services.length > 0 && draft.services.length <= 5 && new Set(draft.services).size === draft.services.length &&
    draft.services.every(id => EVENT_SERVICES.some(s => s.id === id));
}
export function eventEstimate(draft: EventDraft, listings: EventListing[], now = new Date(), demoAllowed = false) {
  const rows = draft.services.map(service => {
    const candidates = listings.filter(row => row.service === service && row.ownerConfirmed && (!row.demo || demoAllowed) &&
      Number.isFinite(row.amount) && row.amount > 0 && row.currency === 'EGP' && row.providerName.trim() &&
      new Date(row.updatedAt) <= now && new Date(row.expiresAt) > now &&
      (row.unit === 'event' || row.unit === 'guest'));
    // Do not silently choose a provider when more than one is eligible.
    const listing = candidates.length === 1 ? candidates[0] : null;
    return { service, listing, amount: listing ? Math.round(listing.amount * (listing.unit === 'event' ? 1 : draft.guests) * 100) / 100 : null };
  });
  const complete = rows.length > 0 && rows.every(row => row.amount !== null);
  return { rows, total: complete ? rows.reduce((sum, row) => sum + row.amount!, 0) : null };
}
