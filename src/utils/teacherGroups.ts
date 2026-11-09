// ─── Teachers' group classes: schedules, labels, and how joining one is booked
import type { Provider, SchoolStage, ServiceOption, TeacherGroup, TeacherSubject } from '@/types';
import { MODE_LABELS, STAGE_LABELS } from '@/data/teachers';
import { toArabicDigits } from './arabicNumbers';
import { counted } from './plural';

export const LESSON_OPTION_ID = 'lesson';
export const GROUP_OPTION_ID = 'group';
export const LESSON_PRIVATE = 'حصص خصوصي';
export const LESSON_GROUP = 'حضور في مجموعة';

// Village groups meet twice a week per subject.
const DAY_PAIRS: string[][] = [
  ['السبت', 'التلات'],
  ['الأحد', 'الأربع'],
  ['الاتنين', 'الخميس'],
  ['السبت', 'الأربع'],
];
const TIMES = ['3:00 م', '4:30 م', '5:00 م', '6:00 م', '7:30 م', '8:30 م'];
const GROUP_MODES: TeacherGroup['mode'][] = ['center', 'teacher_home', 'online'];

/**
 * What one student pays for one group class in a Dakahlia village, by stage (EGP).
 * Secondary maths, sciences and languages cost a little more.
 */
export const GROUP_CLASS_PRICE: Record<SchoolStage, number> = { primary: 20, prep: 25, secondary: 35 };
const SECONDARY_CORE: TeacherSubject[] = ['math', 'physics', 'chemistry', 'biology', 'english', 'french', 'german'];
const SECONDARY_CORE_PRICE = 40;

/**
 * One group class for this teacher and stage: the teacher's own group price when set,
 * else the village price for the stage, never more than half a private lesson.
 */
export function groupClassPrice(provider: Provider, stage: SchoolStage): number {
  if (provider.groupPrice != null) return provider.groupPrice;
  const village =
    stage === 'secondary' && provider.subject && SECONDARY_CORE.includes(provider.subject)
      ? SECONDARY_CORE_PRICE
      : GROUP_CLASS_PRICE[stage];
  if (provider.numericPrice == null) return village;
  return Math.max(15, Math.min(village, Math.floor(provider.numericPrice / 2 / 5) * 5));
}

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
        monthlyPrice: groupClassPrice(provider, stage) * days.length * 4,
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
  return `فاضل ${toArabicDigits(seatsLeft)} ${counted(seatsLeft, 'مكان', 'مكانين', 'أماكن')}`;
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
