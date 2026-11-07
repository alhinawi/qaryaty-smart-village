import { it, expect } from 'vitest';
import { appearanceGate, appearanceEnabled, setAppearanceGate, subscribeAppearanceGate } from './appearanceGate';
it('unknown/off both fail closed, verified ON restores', () => {setAppearanceGate(null);expect(appearanceGate()).toBe(null);expect(appearanceEnabled()).toBe(false);setAppearanceGate(false);expect(appearanceEnabled()).toBe(false);setAppearanceGate(true);expect(appearanceEnabled()).toBe(true);setAppearanceGate(null);});
it('subscribers update synchronously without persistent authorization', () => {let count=0;const off=subscribeAppearanceGate(()=>count++);setAppearanceGate(false);expect(count).toBe(1);off();setAppearanceGate(true);expect(count).toBe(1);setAppearanceGate(null);});
