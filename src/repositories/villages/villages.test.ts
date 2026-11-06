import { describe, expect, it, vi } from 'vitest';
import { knownVillage } from '@/data/villages';
import { villageCenter } from '@/services/maps/config';
import { createMockVillageRepo } from './mockVillageRepo';
import { createSupabaseVillageRepo, toVillageOption } from './supabaseVillageRepo';
import { normalizeArabic, villageOptionLabel } from './types';

describe('normalizeArabic', () => {
  it('treats ة/ه, ى/ي and the alef forms as one letter', () => {
    expect(normalizeArabic('مُنْيَة سندوب')).toBe(normalizeArabic('منيه سندوب'));
    expect(normalizeArabic('مصطفى')).toBe(normalizeArabic('مصطفي'));
    expect(normalizeArabic('أبو داود')).toBe(normalizeArabic('ابو داود'));
    expect(normalizeArabic('إيتاى   البارود')).toBe('ايتاي البارود');
  });
});

describe('village labels', () => {
  it('names the markaz and governorate', () => {
    expect(villageOptionLabel({ name: 'منية سندوب', markaz: 'مركز المنصورة', governorate: 'الدقهلية' })).toBe(
      'منية سندوب، مركز المنصورة - الدقهلية',
    );
    expect(villageOptionLabel({ name: 'سيوة', markaz: '', governorate: 'مطروح' })).toBe('سيوة - مطروح');
  });

  it('a chosen label still finds our villages and their map point', () => {
    expect(knownVillage('منية سندوب، مركز المنصورة - الدقهلية')).toBe('منية سندوب');
    expect(villageCenter('منية سندوب، مركز المنصورة - الدقهلية')).toEqual(villageCenter('منية سندوب'));
  });

  it('a village with our name in another governorate is not ours', () => {
    expect(knownVillage('منية سندوب، مركز بلبيس - الشرقية')).toBeNull();
  });

  it('old free-text values keep working', () => {
    expect(knownVillage('منيه سندوب')).toBe('منية سندوب');
  });
});

describe('mock village repo', () => {
  it('needs two letters and finds by any word', async () => {
    const repo = createMockVillageRepo();
    expect(await repo.search('م')).toEqual([]);
    const hits = await repo.search('سندوب');
    expect(hits[0]?.name).toBe('منية سندوب');
    expect(hits[0]?.served).toBe(true);
  });
});

describe('supabase village repo', () => {
  it('calls search_villages once per query and maps rows', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        { id: 7, name: 'منية سندوب', markaz: 'مركز المنصورة', governorate: 'الدقهلية', served: true, kind: 'village', label: null },
      ],
      error: null,
    });
    const repo = createSupabaseVillageRepo(async () => ({ rpc }) as never);
    const first = await repo.search('منية سندوب');
    await repo.search('منيه  سندوب');
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('search_villages', { q: 'منيه سندوب', lim: 20 });
    expect(first[0]).toMatchObject({ id: 7, served: true, label: 'منية سندوب، مركز المنصورة - الدقهلية' });
  });

  it('turns a failed call into a RepoError', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const repo = createSupabaseVillageRepo(async () => ({ rpc }) as never);
    await expect(repo.search('سندوب')).rejects.toMatchObject({ name: 'RepoError' });
  });

  it('fills a missing markaz', () => {
    expect(toVillageOption({ id: 1, name: 'سيوة', markaz: null, governorate: 'مطروح', served: false, kind: 'city' }).label).toBe('سيوة - مطروح');
  });
});
