// ─── وضع العرض التجريبي (demo mode)
// true (default): the seeded demo shops/providers/services show.
// false ("الوضع الحقيقي"): only real rows show — demo content is hidden,
// never deleted, and comes back the moment the switch flips back.
// The value lives in app_settings ('demo_mode', 1/0), loads at startup, and
// the repositories read it here at query time.
//
// Reactivity contract (single source for all consumers):
// - subscribeDemoMode() fires synchronously on every setDemoModeFlag() and
//   invalidateDemoMode() call. React UI uses the useDemoMode() hook; non-React
//   consumers (e.g. the simulated demo rider) subscribe directly.
// - isDemoMode() is the last known switch value (catalog gating).
// - isTrackingDemoMode() additionally requires a verified successful read:
//   it is false before the first load and after any failed read
//   (invalidateDemoMode), so simulated content fails closed.
let demoMode = true;
let verified = false;

const listeners = new Set<() => void>();

export function isDemoMode(): boolean {
  return demoMode;
}

/** Subscribe to flag/verification changes. Returns an unsubscribe function. */
export function subscribeDemoMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setDemoModeFlag(on: boolean): void {
  verified = true;
  demoMode = on;
  for (const listener of listeners) listener();
}

/** Verified demo mode: true only after a successful read confirmed demo ON. */
export function isTrackingDemoMode(): boolean {
  return verified && demoMode;
}

/** Mark the setting unknown (read failed); simulated content must hide. */
export function invalidateDemoMode(): void {
  verified = false;
  for (const listener of listeners) listener();
}

/** Whether creation can capture an authoritative ON/OFF snapshot. */
export function isDemoModeVerified(): boolean { return verified; }
