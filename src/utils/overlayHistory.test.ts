import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetOverlayHistory, closeOverlay, openOverlay, whenHistorySettled } from './overlayHistory';

// Minimal fake of window.history: back() is async like the real one.
function installFakeHistory() {
  const entries: unknown[] = [{ idx: 0 }];
  let index = 0;
  const listeners: Array<() => void> = [];
  const history = {
    get state() {
      return entries[index];
    },
    pushState(state: unknown) {
      entries.splice(index + 1);
      entries.push(state);
      index += 1;
    },
    back() {
      queueMicrotask(() => {
        if (index === 0) return;
        index -= 1;
        listeners.forEach((l) => l());
      });
    },
  };
  vi.stubGlobal('window', {
    history,
    addEventListener: (_: string, l: () => void) => listeners.push(l),
  });
  return { history, entries, getIndex: () => index };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('overlayHistory', () => {
  let fake: ReturnType<typeof installFakeHistory>;
  beforeEach(() => {
    __resetOverlayHistory();
    fake = installFakeHistory();
  });

  it('back closes the open overlay instead of leaving the page', async () => {
    const close = vi.fn();
    openOverlay(close);
    expect(fake.getIndex()).toBe(1);
    fake.history.back();
    await flush();
    expect(close).toHaveBeenCalledOnce();
    expect(fake.getIndex()).toBe(0);
  });

  it('closing from the UI removes the extra history entry', async () => {
    const close = vi.fn();
    const id = openOverlay(close);
    closeOverlay(id);
    await flush();
    expect(fake.getIndex()).toBe(0);
    expect(close).not.toHaveBeenCalled();
  });

  it('stacked overlays close one per back press, top first', async () => {
    const first = vi.fn();
    const second = vi.fn();
    openOverlay(first);
    openOverlay(second);
    fake.history.back();
    await flush();
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });

  it('does not undo a navigation that happened while closing', async () => {
    const id = openOverlay(vi.fn());
    fake.history.pushState({ idx: 1 }); // router navigated to a new page
    closeOverlay(id);
    await flush();
    expect(fake.getIndex()).toBe(2);
  });

  it('an overlay opened as another closes keeps its own entry, so back closes it', async () => {
    const first = openOverlay(vi.fn());
    closeOverlay(first); // its back is on its way
    const second = vi.fn();
    openOverlay(second); // e.g. the search closed and a shop menu opened
    await flush();
    expect(fake.getIndex()).toBe(1);
    fake.history.back();
    await flush();
    expect(second).toHaveBeenCalledOnce();
    expect(fake.getIndex()).toBe(0);
  });

  it('an overlay closed before its entry was added leaves history alone', async () => {
    const first = openOverlay(vi.fn());
    closeOverlay(first);
    const second = openOverlay(vi.fn());
    closeOverlay(second);
    await flush();
    expect(fake.getIndex()).toBe(0);
  });

  it('waits for our back to land before a navigation runs', async () => {
    const id = openOverlay(vi.fn());
    closeOverlay(id);
    const navigate = vi.fn(() => fake.history.pushState({ idx: 1 }));
    whenHistorySettled(navigate);
    expect(navigate).not.toHaveBeenCalled();
    await flush();
    expect(navigate).toHaveBeenCalledOnce();
    expect(fake.getIndex()).toBe(1);
    whenHistorySettled(navigate); // nothing pending: runs at once
    expect(navigate).toHaveBeenCalledTimes(2);
  });
});
