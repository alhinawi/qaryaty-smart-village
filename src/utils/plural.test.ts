import { describe, it, expect } from 'vitest';
import { counted } from './plural';

describe('counted - Egyptian Arabic number agreement', () => {
  const year = (n: number) => counted(n, 'سنة', 'سنتين', 'سنين');

  it('1 takes the singular', () => {
    expect(year(1)).toBe('سنة');
  });
  it('2 takes the dual', () => {
    expect(year(2)).toBe('سنتين');
  });
  it('3 takes the plural', () => {
    expect(year(3)).toBe('سنين');
  });
  it('10 takes the plural', () => {
    expect(year(10)).toBe('سنين');
  });
  it('11 goes back to the singular', () => {
    expect(year(11)).toBe('سنة');
  });
  it('16 goes back to the singular', () => {
    expect(year(16)).toBe('سنة');
  });
  it('100 goes back to the singular', () => {
    expect(year(100)).toBe('سنة');
  });
  it('works for other nouns', () => {
    expect(counted(5, 'يوم', 'يومين', 'أيام')).toBe('أيام');
    expect(counted(15, 'يوم', 'يومين', 'أيام')).toBe('يوم');
    expect(counted(2, 'مشوار', 'مشوارين', 'مشاوير')).toBe('مشوارين');
    expect(counted(12, 'مشوار', 'مشوارين', 'مشاوير')).toBe('مشوار');
    expect(counted(7, 'دقيقة', 'دقيقتين', 'دقائق')).toBe('دقائق');
    expect(counted(45, 'دقيقة', 'دقيقتين', 'دقائق')).toBe('دقيقة');
  });
});
