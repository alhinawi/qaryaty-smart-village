import { describe, expect, it } from 'vitest';
import { PROVIDERS } from '@/data/providers';
import { SERVICES } from '@/data/services';
import { doctorSpecialties, matchesDoctorSpecialty, specialtyId, STANDARD_SPECIALTIES } from './doctorSpecialties';
const doctor = PROVIDERS.find(provider => provider.kind === 'doctor')!;
const services = SERVICES.filter(service => !service.hidden);
describe('full specialty navigation with honest counts', () => {
  it('shows the catalog with zero counts when no doctors are supplied', () => {
    const result = doctorSpecialties([], services);
    expect(result).toHaveLength(STANDARD_SPECIALTIES.length);
    expect(result.every(option => option.count === 0)).toBe(true);
  });
  it('counts only active bookable doctors, appending extra specialties', () => {
    const providers = [{ ...doctor, specialty: 'نسا وتوليد' }, { ...doctor, id: 90001, specialty: 'نساء وتوليد' }, { ...doctor, id: 90002, active: false, specialty: 'جلدية' }, { ...doctor, id: 90003, kind: 'nurse' as const, specialty: 'أسنان' }, { ...doctor, id: 90004, specialty: 'تخصص مسجل جديد' }];
    const result = doctorSpecialties(providers, services);
    expect(result.find(option => option.id === specialtyId('نساء وتوليد'))?.count).toBe(2);
    expect(result.find(option => option.label === 'جلدية')?.count).toBe(0);
    expect(result.find(option => option.label === 'أسنان')?.count).toBe(0);
    expect(result[result.length - 1]?.label).toBe('تخصص مسجل جديد');
    expect(doctorSpecialties(providers, []).every(option => option.count === 0)).toBe(true);
  });
  it('does not match nurses and keeps Arabic variants aligned', () => {
    expect(matchesDoctorSpecialty({ ...doctor, kind: 'nurse' }, specialtyId('باطنة'))).toBe(false);
    expect(matchesDoctorSpecialty({ ...doctor, specialty: 'باطنة' }, specialtyId('باطنه'))).toBe(true);
  });
});
