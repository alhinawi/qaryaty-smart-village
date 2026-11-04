// ─── Graceful degradation around the live backend
//
// read():  try the live source; if it fails, times out, or the breaker is open,
//          return the sample data instead and mark the app as degraded.
// write(): try the live source; if it is down, throw a clear
//          ServiceUnavailableError. Writes NEVER fall back to the sample data,
//          so an order or a login is never "saved" somewhere it isn't.
//
// Expected errors (wrong password, phone already used) are passed through as is
// and don't count as an outage.
import type { CircuitBreaker } from './circuitBreaker';
import { ServiceUnavailableError } from './errors';
import type { StatusReporter } from './status';

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export interface ResilienceOptions {
  breaker: CircuitBreaker;
  status: StatusReporter;
  timeoutMs?: number;
  /** Errors that are a normal answer, not an outage (e.g. wrong password). */
  isExpectedError?: (error: unknown) => boolean;
}

export interface Resilience {
  read<T>(live: () => Promise<T>, fallback: () => Promise<T>): Promise<T>;
  write<T>(live: () => Promise<T>, unavailable?: (cause?: unknown) => Error): Promise<T>;
}

export function createResilience({
  breaker,
  status,
  timeoutMs = 8_000,
  isExpectedError = () => false,
}: ResilienceOptions): Resilience {
  const defaultUnavailable = (cause?: unknown) => new ServiceUnavailableError(undefined, { cause });

  return {
    async read(live, fallback) {
      if (!breaker.canRequest()) {
        status.markDegraded();
        return fallback();
      }
      try {
        const value = await withTimeout(live(), timeoutMs);
        breaker.recordSuccess();
        status.markLive();
        return value;
      } catch (error) {
        console.warn('[qaryati] live read failed, showing sample data', error);
        breaker.recordFailure();
        status.markDegraded();
        return fallback();
      }
    },

    async write(live, unavailable = defaultUnavailable) {
      if (!breaker.canRequest()) {
        status.markDegraded();
        throw unavailable();
      }
      try {
        const value = await withTimeout(live(), timeoutMs);
        breaker.recordSuccess();
        status.markLive();
        return value;
      } catch (error) {
        if (isExpectedError(error)) {
          // The backend answered: it is up, the request was just refused
          breaker.recordSuccess();
          status.markLive();
          throw error;
        }
        console.warn('[qaryati] live write failed', error);
        breaker.recordFailure();
        status.markDegraded();
        throw unavailable(error);
      }
    },
  };
}
