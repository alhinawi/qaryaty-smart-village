import { describe, expect, it } from 'vitest';
import { isShopBusy } from './shopBusy';

const now = new Date('2026-11-07T10:00:00Z');

describe('isShopBusy', () => {
  it('is false without the flag', () => {
    expect(isShopBusy({}, now)).toBe(false);
    expect(isShopBusy({ busy: false, busyUntil: '2026-11-07T11:00:00Z' }, now)).toBe(false);
  });

  it('stays busy with no expiry until the merchant clears it', () => {
    expect(isShopBusy({ busy: true }, now)).toBe(true);
  });

  it('auto-expires once busyUntil passes', () => {
    expect(isShopBusy({ busy: true, busyUntil: '2026-11-07T10:30:00Z' }, now)).toBe(true);
    expect(isShopBusy({ busy: true, busyUntil: '2026-11-07T09:30:00Z' }, now)).toBe(false);
  });

  it('fails closed on a broken expiry value', () => {
    expect(isShopBusy({ busy: true, busyUntil: 'مش-تاريخ' }, now)).toBe(false);
  });
});
