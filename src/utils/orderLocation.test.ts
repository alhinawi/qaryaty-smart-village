import { describe, expect, it } from 'vitest';
import { validOrderPoint } from './orderLocation';
describe('mandatory selected order location', () => {
  it('accepts finite in-range coordinates including zero', () => { expect(validOrderPoint({lat:0,lng:0})).toBe(true); expect(validOrderPoint({lat:31,lng:31})).toBe(true); });
  it('rejects missing legacy values, strings, NaN and out-of-range', () => { for (const p of [null, {}, {lat:null,lng:null},{lat:'31',lng:31},{lat:NaN,lng:31},{lat:91,lng:31},{lat:31,lng:181}]) expect(validOrderPoint(p)).toBe(false); });
});
