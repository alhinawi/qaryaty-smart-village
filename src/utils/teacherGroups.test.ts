import { describe, expect, it } from 'vitest';
import { PROVIDERS } from '@/data/providers';
import { SERVICES } from '@/data/services';
import { getOrderPricing, providerToOrderModalData, visibleOptions } from './pricing';
import {
  GROUP_CLASS_PRICE,
  GROUP_OPTION_ID,
  classesPerMonth,
  groupClassPrice,
  LESSON_GROUP,
  LESSON_OPTION_ID,
  LESSON_PRIVATE,
  groupLabel,
  groupPreselection,
  seatsText,
} from './teacherGroups';
import { toArabicDigits } from './arabicNumbers';

const teachers = PROVIDERS.filter((p) => p.kind === 'teacher');
const withGroups = teachers.filter((t) => t.groups?.length);

describe('teacher groups', () => {
  it('most teachers have group classes, each with days, a time and a monthly fee', () => {
    expect(withGroups.length).toBeGreaterThan(teachers.length / 2);
    for (const teacher of withGroups) {
      const labels = teacher.groups!.map(groupLabel);
      expect(new Set(labels).size, teacher.name).toBe(labels.length);
      for (const group of teacher.groups!) {
        expect(group.days.length).toBeGreaterThan(0);
        expect(group.time).toMatch(/\d:\d\d [صم]/);
        expect(group.monthlyPrice).toBeGreaterThan(0);
        expect(teacher.stages).toContain(group.stage);
        expect(teacher.modes).toContain(group.mode);
      }
    }
  });

  it('joining a group is booked at its monthly fee, private lessons at the teacher price', () => {
    const teacher = withGroups.find((t) => t.groups!.some((g) => g.seatsLeft > 0))!;
    const group = teacher.groups!.find((g) => g.seatsLeft > 0)!;
    const service = SERVICES.find((s) => s.id === teacher.serviceId);
    const data = providerToOrderModalData(teacher, service, groupPreselection(group));

    const asGroup = data.preselected!;
    expect(asGroup[LESSON_OPTION_ID]).toBe(LESSON_GROUP);
    // A group already says the stage and the place: only lesson type and group are asked
    expect(visibleOptions(data.options, asGroup).map((o) => o.id)).toEqual([LESSON_OPTION_ID, GROUP_OPTION_ID]);
    const groupPrice = getOrderPricing(data, false, { selections: asGroup });
    expect(groupPrice.finalPrice).toBe(group.monthlyPrice);
    expect(groupPrice.priceLabel).toBe(`${group.monthlyPrice} ج/الشهر`);

    const asPrivate = { [LESSON_OPTION_ID]: LESSON_PRIVATE };
    expect(visibleOptions(data.options, asPrivate).map((o) => o.id)).not.toContain(GROUP_OPTION_ID);
    expect(getOrderPricing(data, false, { selections: asPrivate }).basePrice).toBe(teacher.numericPrice);
  });

  it('prices are village prices, and a group class costs at most half a private lesson', () => {
    for (const teacher of teachers) {
      if (teacher.numericPrice == null) continue;
      expect(teacher.numericPrice, teacher.name).toBeLessThanOrEqual(110);
      for (const group of teacher.groups ?? []) {
        const perClass = group.monthlyPrice / classesPerMonth(group);
        expect(perClass, teacher.name).toBeLessThanOrEqual(teacher.numericPrice / 2);
        expect(perClass, teacher.name).toBeLessThanOrEqual(40);
        expect(group.monthlyPrice, teacher.name).toBeLessThanOrEqual(320);
      }
    }
  });

  it('a group class costs more as the stage goes up, and a set group price wins', () => {
    const teacher = teachers.find((t) => t.subject === 'arabic' && t.numericPrice != null)!;
    const priced = { ...teacher, numericPrice: 100 };
    expect(groupClassPrice(priced, 'primary')).toBe(GROUP_CLASS_PRICE.primary);
    expect(groupClassPrice(priced, 'prep')).toBe(GROUP_CLASS_PRICE.prep);
    expect(groupClassPrice(priced, 'secondary')).toBe(GROUP_CLASS_PRICE.secondary);
    expect(groupClassPrice({ ...priced, subject: 'physics' }, 'secondary')).toBe(40);
    expect(groupClassPrice({ ...priced, numericPrice: 40 }, 'secondary')).toBe(20);
    expect(groupClassPrice({ ...priced, groupPrice: 55 }, 'primary')).toBe(55);
  });

  it('a full group cannot be picked in the order form', () => {
    const teacher = withGroups.find((t) => t.groups!.some((g) => g.seatsLeft === 0));
    if (!teacher) return;
    const full = teacher.groups!.find((g) => g.seatsLeft === 0)!;
    const data = providerToOrderModalData(teacher, SERVICES.find((s) => s.id === teacher.serviceId));
    const groupOption = data.options?.find((o) => o.id === GROUP_OPTION_ID);
    expect(groupOption?.choices ?? []).not.toContain(groupLabel(full));
  });

  it('says the free places in Arabic digits', () => {
    expect(seatsText(0)).toBe('المجموعة كاملة');
    expect(seatsText(3)).toBe('فاضل ٣ أماكن');
    expect(toArabicDigits(12)).toBe('١٢');
  });
});

describe('choice prices, quantity and delivery', () => {
  it('an inspection visit costs the worker\'s own fee', () => {
    const worker = PROVIDERS.find((p) => p.inspectionFee && p.inspectionFee > 0)!;
    const data = providerToOrderModalData(worker, SERVICES.find((s) => s.id === worker.serviceId));
    const p = getOrderPricing(data, false, { selections: { visit_type: 'معاينة الأول' } });
    expect(p.finalPrice).toBe(worker.inspectionFee);
    const start = getOrderPricing(data, false, { selections: { visit_type: 'ابدأ الشغل' } });
    expect(start.finalPrice).toBeNull();
  });

  it('gas cylinders: price × count + one delivery fee', () => {
    const worker = PROVIDERS.find((p) => p.serviceId === 42 && p.deliveryFee)!;
    const data = providerToOrderModalData(worker, SERVICES.find((s) => s.id === 42));
    const p = getOrderPricing(data, false, { quantity: 3 });
    expect(p.finalPrice).toBe(worker.numericPrice! * 3 + worker.deliveryFee!);
  });
});
