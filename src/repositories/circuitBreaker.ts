// ─── Simple circuit breaker
// After `failureThreshold` failures in a row it "opens" and the app stops
// calling the backend for `cooldownMs`. Then one trial call is let through
// ("half-open"): success closes it again, failure opens it for another cooldown.
// This keeps a paused Supabase project from making every screen wait on a timeout.

export type BreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreaker {
  /** true when a call to the backend may be made now. */
  canRequest(): boolean;
  recordSuccess(): void;
  recordFailure(): void;
  /** Close it now, e.g. when the user taps "جرّب تاني". */
  reset(): void;
  readonly state: BreakerState;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  /** Injected clock for tests. */
  now?: () => number;
}

export function createCircuitBreaker({
  failureThreshold = 3,
  cooldownMs = 30_000,
  now = Date.now,
}: CircuitBreakerOptions = {}): CircuitBreaker {
  let failures = 0;
  let openedAt: number | null = null;
  let trialInFlight = false;

  const currentState = (): BreakerState => {
    if (openedAt === null) return 'closed';
    return now() - openedAt >= cooldownMs ? 'half-open' : 'open';
  };

  return {
    get state() {
      return currentState();
    },
    canRequest() {
      const state = currentState();
      if (state === 'closed') return true;
      if (state === 'open') return false;
      // half-open: let a single trial call through
      if (trialInFlight) return false;
      trialInFlight = true;
      return true;
    },
    recordSuccess() {
      failures = 0;
      openedAt = null;
      trialInFlight = false;
    },
    recordFailure() {
      trialInFlight = false;
      failures += 1;
      if (openedAt !== null || failures >= failureThreshold) openedAt = now();
    },
    reset() {
      failures = 0;
      openedAt = null;
      trialInFlight = false;
    },
  };
}
