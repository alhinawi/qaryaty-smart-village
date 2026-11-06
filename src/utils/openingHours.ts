// ─── Opening hours as customers read them: "⏰ 7ص - 12م" or "⏰ 24 ساعة"
// The dashboard edits them with selects; the stored text keeps this exact
// shape so every place that shows shop.time stays correct.

export const HOUR_OPTIONS: string[] = [
  '12ص', '1ص', '2ص', '3ص', '4ص', '5ص', '6ص', '7ص', '8ص', '9ص', '10ص', '11ص',
  '12م', '1م', '2م', '3م', '4م', '5م', '6م', '7م', '8م', '9م', '10م', '11م',
];

export interface OpeningHours {
  allDay: boolean;
  from: string;
  to: string;
}

/** Reads the stored text into select values; unparseable text gets a sensible default. */
export function parseOpeningHours(value: string): OpeningHours {
  if (value.includes('24')) return { allDay: true, from: '9ص', to: '9م' };
  const range = value.match(/(\d{1,2})\s*([صم])\s*-\s*(\d{1,2})\s*([صم])/);
  if (range) return { allDay: false, from: `${range[1]}${range[2]}`, to: `${range[3]}${range[4]}` };
  return { allDay: false, from: '9ص', to: '9م' };
}

/** Composes the select values back into the stored customer-facing text. */
export function formatOpeningHours(hours: OpeningHours): string {
  return hours.allDay ? '⏰ 24 ساعة' : `⏰ ${hours.from} - ${hours.to}`;
}
