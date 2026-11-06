import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import type { Provider } from '@/types';
import { DEVELOPER_NAME } from '@/config/developer';
import { DEVELOPER_TEACHER_IDS, PROVIDERS } from './providers';
import { SERVICES } from './services';
import { providerToOrderModalData } from '@/utils/pricing';
import { STAGES, STAGE_LABELS, SUBJECTS, SUBJECT_STAGES } from './teachers';

const isReal = (p: Provider) => (DEVELOPER_TEACHER_IDS as readonly number[]).includes(p.id);

describe('providers sample data', () => {
  it('ids are unique and every provider points to a real service', () => {
    expect(new Set(PROVIDERS.map((p) => p.id)).size).toBe(PROVIDERS.length);
    const serviceIds = new Set(SERVICES.map((s) => s.id));
    for (const provider of PROVIDERS) expect(serviceIds.has(provider.serviceId)).toBe(true);
  });

  it('teachers have a subject; school subjects also list their stages', () => {
    for (const teacher of PROVIDERS.filter((p) => p.kind === 'teacher')) {
      expect(teacher.subject).toBeDefined();
      // The developer teaches all ages; nothing is made up for him
      if (isReal(teacher)) continue;
      // Quran teachers have no stages: they teach all ages
      if (teacher.subject !== 'quran') expect(teacher.stages?.length).toBeGreaterThan(0);
    }
  });

  it('booking a provider keeps the provider and service ids on the order', () => {
    const provider = PROVIDERS[0];
    const service = SERVICES.find((s) => s.id === provider.serviceId);
    const data = providerToOrderModalData(provider, service);
    expect(data.providerId).toBe(provider.id);
    expect(data.serviceId).toBe(provider.serviceId);
    expect(data.name).toContain(provider.name);
  });

  it("booking a specific person only offers that person's choices", () => {
    const byId = (id: number) => PROVIDERS.find((p) => p.id === id)!;
    const serviceOf = (id: number) => SERVICES.find((s) => s.id === byId(id).serviceId)!;
    const choices = (id: number, option: string) =>
      providerToOrderModalData(byId(id), serviceOf(id)).options?.find((o) => o.id === option)?.choices;
    // أ. نهى الشافعي: English, primary only, in a centre and online
    expect(choices(63, 'stage')).toEqual(['ابتدائي']);
    expect(choices(63, 'mode')).toEqual(['في سنتر', 'أونلاين']);
    // أ. محمود عبد الرازق: at his home or at yours, not online
    expect(choices(65, 'mode')).toEqual(['في بيتك', 'في بيت المدرس']);
    for (const p of PROVIDERS.filter((x) => x.kind === 'teacher' && x.stages)) {
      const offered = choices(p.id, 'stage');
      if (offered) for (const c of offered) expect(p.stages!.map((st) => STAGE_LABELS[st])).toContain(c);
    }
    for (const nurse of PROVIDERS.filter((x) => x.kind === 'nurse')) {
      expect(choices(nurse.id, 'gender')).toEqual([nurse.gender === 'female' ? 'ممرضة' : 'ممرض']);
    }
  });

  it('every subject and every stage it is taught at has at least two teachers', () => {
    const teachers = PROVIDERS.filter((p) => p.kind === 'teacher' && p.active);
    for (const { id: subject } of SUBJECTS) {
      for (const stage of SUBJECT_STAGES[subject]) {
        const count = teachers.filter(
          (t) => t.subject === subject && (!t.stages || t.stages.includes(stage))
        ).length;
        expect(count, `${subject} / ${stage}`).toBeGreaterThanOrEqual(2);
        // Female and male teachers in every subject and stage
        const genders = new Set(
          teachers
            .filter((t) => t.subject === subject && (!t.stages || t.stages.includes(stage)))
            .map((t) => t.gender)
        );
        expect([...genders].sort(), `${subject} / ${stage}`).toEqual(['female', 'male']);
      }
    }
  });

  it("teachers' stages are stages their subject is taught at", () => {
    for (const t of PROVIDERS.filter((p) => p.kind === 'teacher')) {
      for (const stage of t.stages ?? []) expect(SUBJECT_STAGES[t.subject!]).toContain(stage);
    }
  });

  it('the stage choices in teaching services match the subject stages', () => {
    const labels = new Set(STAGES.map((s) => s.label));
    for (const service of SERVICES.filter((s) => s.subject)) {
      const stageOption = service.options?.find((o) => o.id === 'stage');
      for (const choice of stageOption?.choices ?? []) {
        expect(labels.has(choice)).toBe(true);
        const allowed = SUBJECT_STAGES[service.subject!].map((st) => STAGE_LABELS[st]);
        expect(allowed).toContain(choice);
      }
    }
  });

  it('the developer is a teacher of programming and English, with his own photo', () => {
    const cards = PROVIDERS.filter(isReal);
    expect(cards.map((p) => p.subject)).toEqual(['computer', 'english']);
    for (const p of cards) {
      expect(p.name).toBe(DEVELOPER_NAME);
      expect(p.photo).toBe('/img/t/mohamed-alhinawi.webp');
      expect(existsSync(`public${p.photo}`)).toBe(true);
      expect(p.modes).toEqual(['online']);
      // No made-up price, rating, years or groups
      expect([p.numericPrice, p.priceType, p.reviews, p.experienceYears, p.groups]).toEqual([null, 'quote', 0, 0, undefined]);
    }
  });

  it('every sample person has a distinct generated portrait of their own', () => {
    const samples = PROVIDERS.filter((p) => !isReal(p));
    for (const p of samples) {
      expect(p.photo).toBe(`/img/providers/provider-${p.id}.webp`);
      expect(existsSync(`public${p.photo}`)).toBe(true);
    }
    expect(new Set(samples.map((p) => p.photo)).size).toBe(samples.length);
    expect(new Set(PROVIDERS.map((p) => p.id)).size).toBe(PROVIDERS.length);
  });
});
