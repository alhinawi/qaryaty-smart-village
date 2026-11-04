// ─── Teacher subjects and school stages
import type { ProviderKind, ProviderMode, SchoolStage, TeacherSubject } from '@/types';

export const SUBJECTS: { id: TeacherSubject; label: string }[] = [
  { id: 'arabic', label: 'عربي' },
  { id: 'english', label: 'إنجليزي' },
  { id: 'math', label: 'رياضيات' },
  { id: 'science', label: 'علوم' },
  { id: 'history', label: 'تاريخ' },
  { id: 'geography', label: 'جغرافيا' },
  { id: 'physics', label: 'فيزياء' },
  { id: 'chemistry', label: 'كيمياء' },
  { id: 'biology', label: 'أحياء' },
  { id: 'french', label: 'فرنساوي' },
  { id: 'german', label: 'ألماني' },
  { id: 'quran', label: 'قرآن' },
  { id: 'computer', label: 'كمبيوتر وبرمجة' },
];

export const SUBJECT_LABELS = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.label])) as Record<
  TeacherSubject,
  string
>;

export const STAGES: { id: SchoolStage; label: string }[] = [
  { id: 'primary', label: 'ابتدائي' },
  { id: 'prep', label: 'إعدادي' },
  { id: 'secondary', label: 'ثانوي' },
];

export const STAGE_LABELS = Object.fromEntries(STAGES.map((s) => [s.id, s.label])) as Record<
  SchoolStage,
  string
>;

export const MODE_LABELS: Record<ProviderMode, string> = {
  home: 'في البيت',
  online: 'أونلاين',
  clinic: 'في العيادة',
};

export const PROVIDER_KIND_LABELS: Record<ProviderKind, { male: string; female: string }> = {
  teacher: { male: 'مدرس', female: 'مدرسة' },
  nurse: { male: 'ممرض', female: 'ممرضة' },
  doctor: { male: 'دكتور', female: 'دكتورة' },
  babysitter: { male: 'جليس أطفال', female: 'جليسة أطفال' },
  cleaner: { male: 'عامل نظافة', female: 'عاملة نظافة' },
};
