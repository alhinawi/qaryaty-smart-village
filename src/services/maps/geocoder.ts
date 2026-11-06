// ─── Place names ↔ points on the map (Nominatim, OpenStreetMap's free service)
// Its usage policy: at most 1 request a second, cache answers, identify the app
// (the browser sends our site as the Referer; it won't let us set User-Agent),
// and no search-as-you-type: search runs when the person presses بحث.
// https://operations.osmfoundation.org/policies/nominatim/
import type { LatLng } from '@/types';
import { SEARCH_VIEWBOX } from './config';

export interface PlaceResult extends LatLng {
  /** Short name to show: الشارع أو المكان */
  title: string;
  /** The rest: القرية، المركز، المحافظة */
  subtitle: string;
  /** The street name alone, to fill الشارع in the form. */
  road: string;
}

export interface Geocoder {
  search(query: string, signal?: AbortSignal): Promise<PlaceResult[]>;
  reverse(point: LatLng, signal?: AbortSignal): Promise<PlaceResult | null>;
}

const BASE = 'https://nominatim.openstreetmap.org';
const MIN_GAP_MS = 1100;

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  footway?: string;
  neighbourhood?: string;
  suburb?: string;
  hamlet?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
  amenity?: string;
  building?: string;
  shop?: string;
}

interface NominatimPlace {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: NominatimAddress;
}

function toPlace(p: NominatimPlace): PlaceResult {
  const a = p.address ?? {};
  const road = a.road ?? a.pedestrian ?? a.footway ?? '';
  const spot = p.name || a.amenity || a.shop || a.building || '';
  const area = a.village ?? a.hamlet ?? a.neighbourhood ?? a.suburb ?? a.town ?? a.city ?? '';
  const title = spot || road || area || p.display_name.split(',')[0];
  const subtitle = [spot && road && road !== title ? road : '', area !== title ? area : '', a.county ?? a.city ?? '', a.state ?? '']
    .filter((x, i, all) => x && all.indexOf(x) === i && x !== title)
    .join('، ');
  return { lat: Number(p.lat), lng: Number(p.lon), title, subtitle, road };
}

export function createNominatimGeocoder(fetchImpl: typeof fetch = (...args) => fetch(...args)): Geocoder {
  let last = 0;
  let queue: Promise<unknown> = Promise.resolve();
  const cache = new Map<string, unknown>();

  /** One request at a time, at least 1.1 s apart, and the same question is asked once. */
  function get<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
    const qs = new URLSearchParams({ format: 'jsonv2', 'accept-language': 'ar', ...params });
    const url = `${BASE}/${path}?${qs}`;
    if (cache.has(url)) return Promise.resolve(cache.get(url) as T);
    const run = async (): Promise<T> => {
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
      const wait = last + MIN_GAP_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
      last = Date.now();
      const res = await fetchImpl(url, { signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`nominatim ${res.status}`);
      const data = (await res.json()) as T;
      cache.set(url, data);
      return data;
    };
    const next = queue.then(run, run);
    queue = next.catch(() => undefined);
    return next;
  }

  return {
    async search(query, signal) {
      const q = query.trim();
      if (q.length < 2) return [];
      const data = await get<NominatimPlace[]>(
        'search',
        { q, countrycodes: 'eg', viewbox: SEARCH_VIEWBOX, bounded: '0', addressdetails: '1', limit: '6' },
        signal
      );
      return data.map(toPlace);
    },
    async reverse({ lat, lng }, signal) {
      // ~10 m grid, so small moves reuse the last answer
      const data = await get<NominatimPlace & { error?: string }>(
        'reverse',
        { lat: lat.toFixed(4), lon: lng.toFixed(4), zoom: '18', addressdetails: '1' },
        signal
      );
      if (!data || data.error) return null;
      return toPlace(data);
    },
  };
}

export const geocoder: Geocoder = createNominatimGeocoder();
