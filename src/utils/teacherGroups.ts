// ─── Teachers' group classes: schedules, labels, and how joining one is booked
import type { Provider, SchoolStage, ServiceOption, TeacherGroup } from '@/types';
import { MODE_LABELS, STAGE_LABELS } from '@/data/teachers';
import { toArabicDigits } from './arabicNumbers';

export const LESSON_OPTION_ID = 'lesson';
export const GROUP_OPTION_ID = 'group';
export const LESSON_PRIVATE = 'حصص خصوصي';
export const LESSON_GROUP = 'حضور في مجموعة';

const DAY_PAIRS: string[][] = [
  ['السبت', 'التلات'],
  ['الأحد', 'الأربع'],
  ['الاتنين', 'الخميس'],
  ['السبت', 'الاتنين', 'الأربع'],
];
const TIMES = ['3:00 م', '4:30 م', '5:00 م', '6:00 م', '7:30 م', '8:30 م'];
const GROUP_MODES: TeacherGroup['mode'][] = ['center', 'teacher_home', 'online'];

/** Classes a month: each meeting day comes about 4 times. */
export function classesPerMonth(group: Pick<TeacherGroup, 'days'>): number {
  return group.days.length * 4;
}

/**
 * Sample group classes for one teacher, the same on every load: one or two groups per stage
 * they teach, at their centre, home or online. Teachers who only come to your home have none.
 */
export function sampleTeacherGroups(provider: Provider): TeacherGroup[] {
  if (provider.kind !== 'teacher' || !provider.stages?.length) return [];
  const modes = GROUP_MODES.filter((mode) => provider.modes.includes(mode));
  if (!modes.length) return [];
  const perClass = provider.groupPrice ?? Math.max(30, Math.round(((provider.numericPrice ?? 80) * 0.45) / 5) * 5);
  const groups: TeacherGroup[] = [];
  provider.stages.forEach((stage: SchoolStage, si) => {
    const count = stage === 'secondary' ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const n = provider.id + si * 3 + k * 5;
      const days = DAY_PAIRS[n % DAY_PAIRS.length];
      groups.push({
        id: `g${groups.length + 1}`,
        stage,
        days,
        time: TIMES[(provider.id + si + k * 2) % TIMES.length],
        minutes: stage === 'primary' ? 60 : 90,
        mode: modes[(si + k) % modes.length],
        seatsLeft: (provider.id * 7 + si * 5 + k * 3) % 13,
        monthlyPrice: perClass * days.length * 4,
      });
    }
  });
  return groups;
}

/** "السبت والتلات" */
export function groupDays(group: Pick<TeacherGroup, 'days'>): string {
  if (group.days.length === 1) return group.days[0];
  return `${group.days.slice(0, -1).join(' و')} و${group.days[group.days.length - 1]}`;
}

/** "ثانوي · السبت والتلات 5:00 م · في سنتر": unique per teacher, used as the order choice. */
export function groupLabel(group: TeacherGroup): string {
  return `${STAGE_LABELS[group.stage]} · ${groupDays(group)} ${group.time} · ${MODE_LABELS[group.mode]}`;
}

/** "فاضل ٣ أماكن", "المجموعة كاملة" */
export function seatsText(seatsLeft: number): string {
  if (seatsLeft <= 0) return 'المجموعة كاملة';
  if (seatsLeft === 1) return 'فاضل مكان واحد';
  if (seatsLeft === 2) return 'فاضل مكانين';
  return `فاضل ${toArabicDigits(seatsLeft)} ${seatsLeft <= 10 ? 'أماكن' : 'مكان'}`;
}

/** Groups that still have room. */
export function openGroups(provider: Provider): TeacherGroup[] {
  return (provider.groups ?? []).filter((group) => group.seatsLeft > 0);
}

/**
 * The order form choices for a teacher with groups: private lessons or a group, then which group
 * (with its monthly fee). The stage and place questions are only asked for private lessons,
 * because a group already says both.
 */
export function teacherLessonOptions(provider: Provider, options: ServiceOption[]): ServiceOption[] {
  const groups = openGroups(provider);
  if (!groups.length) return options;
  const privateOnly = { optionId: LESSON_OPTION_ID, choice: LESSON_PRIVATE };
  const privatePrice =
    provider.numericPrice != null
      ? { price: provider.numericPrice, priceType: provider.priceType, label: provider.price }
      : { price: null };
  return [
    {
      id: LESSON_OPTION_ID,
      label: 'نوع الحصص',
      choices: [LESSON_PRIVATE, LESSON_GROUP],
      prices: { [LESSON_PRIVATE]: privatePrice },
    },
    {
      id: GROUP_OPTION_ID,
      label: 'المجموعة',
      choices: groups.map(groupLabel),
      showWhen: { optionId: LESSON_OPTION_ID, choice: LESSON_GROUP },
      prices: Object.fromEntries(
        groups.map((group) => [
          groupLabel(group),
          { price: group.monthlyPrice, priceType: 'fixed' as const, label: `${group.monthlyPrice} ج/الشهر` },
        ])
      ),
    },
    ...options.map((option) => (option.showWhen ? option : { ...option, showWhen: privateOnly })),
  ];
}

/** Choices to fill in when the customer taps "احجز مكان" on one group. */
export function groupPreselection(group: TeacherGroup): Record<string, string> {
  return { [LESSON_OPTION_ID]: LESSON_GROUP, [GROUP_OPTION_ID]: groupLabel(group) };
}
