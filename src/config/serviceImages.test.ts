import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { imageForService } from './serviceImages';
import { SERVICES } from '@/data/services';

describe('original service illustrations', () => {
  it('never repeats an image path or image bytes and leaves unknown services to emoji', () => {
    const paths = SERVICES.map(imageForService);
    expect(new Set(paths).size).toBe(SERVICES.length);
    const hashes = paths.map(path => createHash('sha256').update(readFileSync(`public${path}`)).digest('hex'));
    expect(new Set(hashes).size).toBe(SERVICES.length);
    expect(imageForService({ id: 99999 })).toBeUndefined();
  });
  it('covers every service category with a small local WebP', () => {
    for (const service of SERVICES) {
      const path = imageForService(service);
      expect(path).toMatch(/^\/img\/services\/[a-z0-9-]+\.webp$/);
      const bytes = readFileSync(`public${path}`);
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
      expect(statSync(`public${path}`).size).toBeLessThan(55_000);
    }
  });
});
