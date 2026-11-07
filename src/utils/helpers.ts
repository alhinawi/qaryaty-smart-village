// ─── Utility Helpers

export function triggerHapticFeedback(): void {
  if (typeof window !== 'undefined') {
    // Try device vibration API if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore vibration errors
      }
    }


  }
}

export function formatCurrency(amount: number): string {
  return `${amount} ج.م`;
}

export function generateOrderNumber(): string {
  return `#${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function getFormattedDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('ar-EG', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(now);
}
