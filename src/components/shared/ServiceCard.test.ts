import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('service card new badge', () => {
  it('keeps the compact new label plain without the redundant emoji', () => {
    const source = readFileSync(new URL('./ServiceCard.tsx', import.meta.url), 'utf8');
    expect(source).toContain('"🔥 الأكثر طلباً" : "جديد"');
    expect(source).not.toContain('🆕');
  });
});
