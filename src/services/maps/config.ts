// ─── Map settings in one place
// Free and with no key: OpenStreetMap streets, Esri satellite, Nominatim for names.
// To move to Google Maps later, change this file, MapCanvas.tsx and geocoder.ts only;
// the picker screens use the small interfaces they export and nothing else.
import type { LatLng } from '@/types';
import { DEFAULT_VILLAGE } from '@/data/villages';

export type MapLayer = 'streets' | 'satellite';

export const TILE_LAYERS: Record<MapLayer, { url: string; attribution: string; maxZoom: number; maxNativeZoom: number }> = {
  streets: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    maxZoom: 20,
    maxNativeZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 20,
    maxNativeZoom: 18,
  },
};

/** Where the map opens when we don't know where the person is yet. */
const VILLAGE_CENTERS: Record<string, LatLng> = {
  // طريق نقيطة - منية سندوب الزراعي (OpenStreetMap)
  'منية سندوب': { lat: 30.99934, lng: 31.37397 },
  'سندوب': { lat: 31.01667, lng: 31.38752 },
};

export const DEFAULT_ZOOM = 16;
export const PICK_ZOOM = 18;

export function villageCenter(village?: string): LatLng {
  const key = (village ?? '').split(' - ')[0].trim().replace(/ى/g, 'ي');
  return VILLAGE_CENTERS[key] ?? VILLAGE_CENTERS[DEFAULT_VILLAGE];
}

/** Around Mansoura: search results from here come first. left,top,right,bottom */
export const SEARCH_VIEWBOX = '31.20,31.15,31.60,30.85';
