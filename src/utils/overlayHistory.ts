// ─── Back button closes overlays
// On Android the system back button (and the browser back button) fires
// `popstate`. Without this, back would leave the page while a modal is open.
// Each open overlay pushes one history entry with the same URL; back pops it
// and closes only the top overlay.

const MARKER = '__qaryatiOverlay';

interface OpenOverlay {
  id: number;
  close: () => void;
  /** False until its history entry is pushed (it waits while one of our backs is on its way). */
  pushed: boolean;
}

const stack: OpenOverlay[] = [];
/** popstate events we caused ourselves with history.back(), to ignore. */
let pendingBacks = 0;
let nextId = 1;
let listening = false;
/** Work that must wait until the backs we started have landed. */
const whenSettled: Array<() => void> = [];

function isMarker(state: unknown): boolean {
  return typeof state === 'object' && state !== null && MARKER in state;
}

function goBackSilently() {
  pendingBacks += 1;
  window.history.back();
}

function flushSettled() {
  while (pendingBacks === 0 && whenSettled.length > 0) whenSettled.shift()?.();
}

/**
 * Runs `fn` once no history.back() of ours is still on its way. history.back() is async:
 * a pushState or a navigation made before it lands would be the entry it removes.
 */
export function whenHistorySettled(fn: () => void): void {
  if (pendingBacks === 0) fn();
  else whenSettled.push(fn);
}

function handlePopState() {
  if (pendingBacks > 0) {
    pendingBacks -= 1;
    flushSettled();
    return;
  }
  const top = stack.pop();
  if (top) {
    top.close();
    return;
  }
  // Landed on an entry of an overlay that is already closed (it was closed by
  // navigating away): skip it so back never seems to do nothing.
  if (isMarker(window.history.state)) goBackSilently();
}

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  window.addEventListener('popstate', handlePopState);
  listening = true;
}

/** Call when an overlay opens. Returns the id to pass to `closeOverlay`. */
export function openOverlay(close: () => void): number {
  ensureListener();
  const id = nextId++;
  const overlay: OpenOverlay = { id, close, pushed: false };
  stack.push(overlay);
  // An overlay opened right as another one closed waits for that one's back to land
  whenHistorySettled(() => {
    if (!stack.includes(overlay)) return; // closed before its turn came
    // Keep react-router's own state (key, idx) so it stays in sync.
    const current = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.pushState({ ...current, [MARKER]: id }, '');
    overlay.pushed = true;
  });
  return id;
}

/**
 * Call when an overlay closes. When it was closed from the UI (not by back),
 * remove its history entry so the next back press does what the user expects.
 */
export function closeOverlay(id: number): void {
  const index = stack.findIndex((o) => o.id === id);
  if (index === -1) return; // already closed by the back button
  const [overlay] = stack.splice(index, 1);
  if (!overlay.pushed) return; // its entry was never added
  // Only step back when we are still on an overlay entry; if the app already
  // navigated to a new page, going back would undo that navigation.
  if (isMarker(window.history.state)) goBackSilently();
}

/** For tests only: forget open overlays and listen again on the next open. */
export function __resetOverlayHistory(): void {
  stack.length = 0;
  pendingBacks = 0;
  whenSettled.length = 0;
  listening = false;
}
