import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PEOPLE_PHOTOS, peoplePhotoSrc, peoplePhotoSrcSet, type PeoplePhotoId } from './peoplePhotos';
import { PEOPLE_SECTIONS } from '@/utils/peopleSections';

const ids = Object.keys(PEOPLE_PHOTOS) as PeoplePhotoId[];

describe('people photos', () => {
  it('every listed width exists on disk as a small webp', () => {
    for (const id of ids) {
      for (const width of PEOPLE_PHOTOS[id].widths) {
        const file = path.join(process.cwd(), 'public', peoplePhotoSrc(id, width));
        expect(existsSync(file), file).toBe(true);
        expect(statSync(file).size, file).toBeLessThan(200 * 1024);
      }
    }
  });

  it('every photo has Arabic alt text', () => {
    for (const id of ids) expect(PEOPLE_PHOTOS[id].alt).toMatch(/[\u0600-\u06FF]{3,}/);
  });

  it('builds a srcset with one entry per width', () => {
    expect(peoplePhotoSrcSet('teacher')).toBe('/img/people/teacher-360.webp 360w, /img/people/teacher-720.webp 720w');
  });

  it('every people section has a photo', () => {
    for (const section of PEOPLE_SECTIONS) expect(ids).toContain(section.photo);
  });
});
