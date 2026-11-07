import type { Provider, Service } from '@/types';
import { normalizeArabic } from './arabicSearch';
import { filterProviders } from './peopleSections';
export interface DoctorSpecialty { id: string; label: string; count: number }
// Navigation categories, never a claim that a doctor is available.
export const STANDARD_SPECIALTIES = ['عام', 'باطنة', 'أطفال', 'نساء وتوليد', 'عظام', 'أسنان', 'جلدية', 'عيون', 'أنف وأذن وحنجرة', 'قلب', 'مخ وأعصاب', 'مسالك بولية', 'نفسية', 'تغذية', 'علاج طبيعي', 'جراحة عامة', 'صدر', 'جهاز هضمي وكبد', 'كلى', 'غدد وسكر', 'روماتيزم', 'أورام', 'أوعية دموية', 'جراحة مخ وأعصاب', 'جراحة قلب وصدر', 'جراحة أطفال', 'حساسية ومناعة', 'أمراض دم', 'طب مسنين', 'سمعيات', 'تخاطب', 'ذكورة وعقم', 'طب ألم', 'طب رياضي', 'أشعة', 'تحاليل طبية'] as const;
export function specialtyId(text: string): string {
  const normalized = normalizeArabic(text.trim());
  const aliases: Record<string, string> = { 'نسا وتوليد': 'نساء وتوليد', 'انف واذن': 'انف واذن وحنجره', 'مسالك': 'مسالك بوليه', 'نفسي': 'نفسيه', 'صدرية': 'صدر' };
  return aliases[normalized] ? normalizeArabic(aliases[normalized]) : normalized;
}
export function doctorSpecialties(providers: Provider[], services: Service[], query = ''): DoctorSpecialty[] {
  const groups = new Map<string, DoctorSpecialty>(STANDARD_SPECIALTIES.map(label => [specialtyId(label), { id: specialtyId(label), label, count: 0 }]));
  for (const provider of filterProviders(providers, services.filter(service => !service.hidden), { kinds: ['doctor'], query })) {
    const label = provider.specialty?.trim().replace(/\s+/g, ' '); if (!label) continue;
    const id = specialtyId(label); const existing = groups.get(id);
    if (existing) existing.count++; else groups.set(id, { id, label, count: 1 });
  }
  return [...groups.values()];
}
export function matchesDoctorSpecialty(provider: Provider, specialty: string): boolean {
  return specialty === 'all' || (provider.kind === 'doctor' && specialtyId(provider.specialty ?? '') === specialty);
}
