/** Only the last visible modal handles keyboard/focus when dialogs are stacked. */
export function isTopDialog(panel: HTMLElement): boolean {
  const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')].filter(el => el.getClientRects().length > 0);
  return dialogs.at(-1) === panel.closest('[role="dialog"]');
}
export function dialogTabStops(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')]
    .filter(el => el.tabIndex >= 0 && !el.matches(':disabled, [aria-disabled="true"]') && !el.closest('[hidden], [inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
}
