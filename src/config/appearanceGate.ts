// Unknown fails closed. Never infer site-wide permission from device storage.
let gate: boolean | null = null;
const listeners = new Set<() => void>();
export function appearanceGate() { return gate; }
export function appearanceEnabled() { return gate === true; }
export function setAppearanceGate(value: boolean | null) { gate = value; listeners.forEach(fn => fn()); }
export function subscribeAppearanceGate(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
