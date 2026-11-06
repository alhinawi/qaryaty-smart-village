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

/**
 * The stages each subject is taught at, so the filters never offer an empty mix
 * (فيزياء ابتدائي). Quran and computer are for all ages.
 */
export const SUBJECT_STAGES: Record<TeacherSubject, SchoolStage[]> = {
  arabic: ['primary', 'prep', 'secondary'],
  english: ['primary', 'prep', 'secondary'],
  math: ['primary', 'prep', 'secondary'],
  science: ['primary', 'prep'],
  history: ['prep', 'secondary'],
  geography: ['prep', 'secondary'],
  physics: ['secondary'],
  chemistry: ['secondary'],
  biology: ['secondary'],
  french: ['primary', 'prep', 'secondary'],
  german: ['prep', 'secondary'],
  quran: ['primary', 'prep', 'secondary'],
  computer: ['primary', 'prep', 'secondary'],
};

export const STAGE_LABELS = Object.fromEntries(STAGES.map((s) => [s.id, s.label])) as Record<
  SchoolStage,
  string
>;

export const MODE_LABELS: Record<ProviderMode, string> = {
  home: 'في بيتك',
  teacher_home: 'في بيت المدرس',
  center: 'في سنتر',
  online: 'أونلاين',
  clinic: 'في العيادة',
};

export const PROVIDER_KIND_LABELS: Record<ProviderKind, { male: string; female: string }> = {
  teacher: { male: 'مدرس', female: 'مدرسة' },
  nurse: { male: 'ممرض', female: 'ممرضة' },
  doctor: { male: 'دكتور', female: 'دكتورة' },
  babysitter: { male: 'جليس أطفال وكبار السن', female: 'جليسة أطفال وكبار السن' },
  cleaner: { male: 'عامل نظافة', female: 'عاملة نظافة' },
  worker: { male: 'مقدم خدمة', female: 'مقدمة خدمة' },
};
