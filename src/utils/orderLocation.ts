export const ORDER_LOCATION_REQUIRED = 'حدّد مكان التوصيل على الخريطة الأول';
export function validOrderPoint(point: { lat?: unknown; lng?: unknown } | null | undefined): point is { lat: number; lng: number } {
  return typeof point?.lat === 'number' && Number.isFinite(point.lat) && point.lat >= -90 && point.lat <= 90 && typeof point.lng === 'number' && Number.isFinite(point.lng) && point.lng >= -180 && point.lng <= 180;
}
