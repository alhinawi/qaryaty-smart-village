import { describe, expect, it, vi } from 'vitest';
import { createCircuitBreaker } from './circuitBreaker';
import { createResilience } from './resilient';
import { ServiceUnavailableError } from './errors';

function setup(isExpectedError?: (e: unknown) => boolean) {
  let time = 0;
  const breaker = createCircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: () => time });
  const status = { markLive: vi.fn(), markDegraded: vi.fn() };
  const resilience = createResilience({ breaker, status, timeoutMs: 50, isExpectedError });
  return { breaker, status, resilience, advance: (ms: number) => (time += ms) };
}

const down = () => Promise.reject(new Error('503 project paused'));

describe('circuit breaker', () => {
  it('opens after repeated failures, then lets one trial through after the cooldown', () => {
    let time = 0;
    const breaker = createCircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: () => time });
    breaker.recordFailure();
    expect(breaker.canRequest()).toBe(true);
    breaker.recordFailure();
    expect(breaker.state).toBe('open');
    expect(breaker.canRequest()).toBe(false);
    time = 1000;
    expect(breaker.canRequest()).toBe(true); // trial
    expect(breaker.canRequest()).toBe(false); // only one
    breaker.recordFailure();
    expect(breaker.state).toBe('open');
    time = 2000;
    expect(breaker.canRequest()).toBe(true);
    breaker.recordSuccess();
    expect(breaker.state).toBe('closed');
  });
});

describe('read with fallback', () => {
  it('returns live data and marks the backend live', async () => {
    const { resilience, status } = setup();
    await expect(resilience.read(async () => 'live', async () => 'mock')).resolves.toBe('live');
    expect(status.markLive).toHaveBeenCalled();
  });

  it('falls back to the sample data when the backend fails', async () => {
    const { resilience, status } = setup();
    await expect(resilience.read(down, async () => 'mock')).resolves.toBe('mock');
    expect(status.markDegraded).toHaveBeenCalled();
  });

  it('falls back when the backend hangs', async () => {
    const { resilience } = setup();
    const hang = () => new Promise<string>(() => {});
    await expect(resilience.read(hang, async () => 'mock')).resolves.toBe('mock');
  });

  it('stops calling the backend once the breaker is open', async () => {
    const { resilience } = setup();
    const live = vi.fn(down);
    await resilience.read(live, async () => 'mock');
    await resilience.read(live, async () => 'mock');
    await resilience.read(live, async () => 'mock');
    expect(live).toHaveBeenCalledTimes(2);
  });
});

describe('write without fallback', () => {
  it('throws a clear error instead of pretending it worked', async () => {
    const { resilience } = setup();
    const error = await resilience.write(down).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect((error as Error).message).toContain('الخدمة متوقفة مؤقتًا');
  });

  it('passes expected errors through without counting them as an outage', async () => {
    class WrongPassword extends Error {}
    const { resilience, breaker } = setup((e) => e instanceof WrongPassword);
    for (let i = 0; i < 3; i++) {
      await expect(resilience.write(() => Promise.reject(new WrongPassword('x')))).rejects.toBeInstanceOf(
        WrongPassword
      );
    }
    expect(breaker.state).toBe('closed');
  });

  it('refuses right away while the breaker is open', async () => {
    const { resilience } = setup();
    const live = vi.fn(down);
    await resilience.write(live).catch(() => {});
    await resilience.write(live).catch(() => {});
    await expect(resilience.write(live)).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(live).toHaveBeenCalledTimes(2);
  });
});
