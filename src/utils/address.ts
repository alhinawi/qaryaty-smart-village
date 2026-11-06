// ─── Saved addresses: text for an order and a link to the map
import type { AddressDraft, LatLng } from '@/types';

export const ADDRESS_LABELS = ['البيت', 'الشغل', 'بيت العيلة'] as const;

export function labelEmoji(label: string): string {
  if (label.includes('شغل')) return '💼';
  if (label.includes('عيلة') || label.includes('أهل')) return '👨‍👩‍👧';
  if (label.includes('بيت')) return '🏠';
  return '📍';
}

/** "شارع الجامع، بيت 12، الدور 2، جنب المدرسة" – the line that goes on the order. */
export function formatAddress(a: Pick<AddressDraft, 'street' | 'building' | 'floor' | 'landmark'>): string {
  const parts = [
    a.street.trim(),
    a.building.trim() && (/^\d/.test(a.building.trim()) ? `بيت ${a.building.trim()}` : a.building.trim()),
    a.floor.trim() && (/^\d/.test(a.floor.trim()) ? `الدور ${a.floor.trim()}` : a.floor.trim()),
    a.landmark.trim() && (/^(جنب|قدام|أمام|ورا|خلف|بجوار|عند|في)/.test(a.landmark.trim())
      ? a.landmark.trim()
      : `علامة مميزة: ${a.landmark.trim()}`),
  ].filter(Boolean);
  return parts.join('، ');
}

/** The text saved on an order (the database keeps up to 300 characters). */
export function addressForOrder(a: Pick<AddressDraft, 'street' | 'building' | 'floor' | 'landmark'>): string {
  return formatAddress(a).slice(0, 300);
}

/** Opens the spot in Google Maps (app on the phone, site on a computer). */
export function googleMapsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}
