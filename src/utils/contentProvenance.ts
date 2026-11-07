import { isDemoMode, isDemoModeVerified } from '@/config/demoMode';

/** Snapshot once when creating, never infer from the current mode later. */
export function creationDemoFlag(): boolean {
  if (!isDemoModeVerified()) throw new Error('استنى لما وضع العرض يتحمّل، وبعدها جرّب تضيف تاني.');
  return isDemoMode();
}

/** Legacy untagged records are preserved, never guessed to be disposable demo. */
export function contentVisible(record: { demo?: boolean }, showDemo: boolean): boolean {
  return record.demo !== true || showDemo;
}
