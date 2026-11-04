import { describe, expect, it } from 'vitest';
import { PROVIDERS } from '@/data/providers';
import { SERVICES } from '@/data/services';
import {
  PEOPLE_SECTIONS,
  filterProviders,
  gridServices,
  quickRequestServices,
  sectionCounts,
  sectionForKind,
  providersForService,
} from './peopleSections';

const visible = SERVICES.filter((s) => !s.hidden);

describe('people sections', () => {
  it('every kind of person has exactly one section', () => {
    for (const provider of PROVIDERS.filter((p) => p.kind !== 'worker')) {
      const sections = PEOPLE_SECTIONS.filter((s) => s.kinds.includes(provider.kind));
      expect(sections).toHaveLength(1);
    }
  });

  it('teachers and people-backed services are not repeated in the services grid', () => {
    const grid = gridServices(visible, PROVIDERS);
    expect(grid.some((s) => s.cat === 'edu')).toBe(false);
    const bookedThrough = new Set(
      PROVIDERS.filter((p) => p.kind !== 'worker').map((p) => p.serviceId)
    );
    expect(grid.some((s) => bookedThrough.has(s.id))).toBe(false);
    // Ordinary services stay
    expect(grid.map((s) => s.name)).toEqual(expect.arrayContaining(['عيش من الفرن', 'سباك', 'غسيل ومكواة']));
  });

  it('every teacher is in the teachers section, and only there', () => {
    const teachers = PROVIDERS.filter((p) => p.kind === 'teacher' && p.active);
    const edu = PEOPLE_SECTIONS.find((s) => s.id === 'edu')!;
    expect(filterProviders(PROVIDERS, visible, { kinds: edu.kinds })).toHaveLength(teachers.length);
    for (const section of PEOPLE_SECTIONS.filter((s) => s.id !== 'edu')) {
      const people = filterProviders(PROVIDERS, visible, { kinds: section.kinds });
      expect(people.some((p) => p.kind === 'teacher')).toBe(false);
    }
    expect(sectionForKind('teacher')?.id).toBe('edu');
  });

  it('teacher filters: subject and stage', () => {
    const math = filterProviders(PROVIDERS, visible, { kinds: ['teacher'], subject: 'math', stage: 'primary' });
    expect(math.length).toBeGreaterThan(0);
    for (const t of math) {
      expect(t.subject).toBe('math');
      expect(t.stages).toContain('primary');
    }
  });

  it('doctors and nurses share one section with a kind filter', () => {
    const nurses = filterProviders(PROVIDERS, visible, { kinds: ['doctor', 'nurse'], kind: 'nurse' });
    expect(nurses.length).toBeGreaterThan(0);
    expect(nurses.every((p) => p.kind === 'nurse')).toBe(true);
  });

  it('search finds teachers by role and subject ("مدرس انجليزي")', () => {
    const found = filterProviders(PROVIDERS, visible, { kinds: ['teacher'], query: 'مدرس انجليزي' });
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((p) => p.subject === 'english')).toBe(true);
  });

  it('people whose service is hidden cannot be booked, so they are left out', () => {
    const withoutGerman = visible.filter((s) => s.subject !== 'german');
    const found = filterProviders(PROVIDERS, withoutGerman, { kinds: ['teacher'], subject: 'german' });
    expect(found).toHaveLength(0);
  });

  it('quick requests: general teacher service, and the services others are booked through', () => {
    const [edu, health] = PEOPLE_SECTIONS;
    expect(quickRequestServices(edu, visible, PROVIDERS).map((s) => s.name)).toEqual(['مدرس خصوصي']);
    const healthNames = quickRequestServices(health, visible, PROVIDERS).map((s) => s.name);
    expect(healthNames).toHaveLength(2);
    expect(healthNames.join(' ')).toContain('تمريض');
    expect(healthNames.join(' ')).toContain('دكتور');
  });

  it('section counts add up to all active, bookable people', () => {
    const counts = sectionCounts(PROVIDERS, visible);
    const total = PEOPLE_SECTIONS.reduce((sum, s) => sum + counts[s.id], 0);
    expect(total).toBe(PROVIDERS.filter((p) => p.active && p.kind !== 'worker').length);
  });

  it('every service in the grid has at least three people to pick from, best rated first', () => {
    for (const service of gridServices(visible, PROVIDERS)) {
      const people = providersForService(service, PROVIDERS);
      expect(people.length, service.name).toBeGreaterThanOrEqual(3);
      expect(people.every((p) => p.kind === 'worker' && p.role)).toBe(true);
      const ratings = people.map((p) => p.rating);
      expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
    }
  });

  it('nurses, doctors and cleaners have both women and men', () => {
    for (const kind of ['nurse', 'doctor', 'cleaner'] as const) {
      const genders = new Set(PROVIDERS.filter((p) => p.kind === kind).map((p) => p.gender));
      expect([...genders].sort(), kind).toEqual(['female', 'male']);
    }
  });

  it('search finds workers by role', () => {
    const plumbers = filterProviders(PROVIDERS, visible, { kinds: ['worker'], query: 'سباك' });
    expect(plumbers.length).toBeGreaterThanOrEqual(3);
  });
});
