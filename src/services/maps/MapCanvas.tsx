// ─── The map itself (Leaflet). The only file that knows about Leaflet.
// A Google Maps version would keep the same props and handle.
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '@/types';
import { DEFAULT_ZOOM, TILE_LAYERS, type MapLayer } from './config';

export interface MapCanvasHandle {
  flyTo(point: LatLng, zoom?: number): void;
  getCenter(): LatLng;
}

export interface UserDot extends LatLng {
  /** metres */
  accuracy?: number;
}

interface MapCanvasProps {
  initialCenter: LatLng;
  initialZoom?: number;
  layer: MapLayer;
  /** false: a still preview (no dragging or zooming). */
  interactive?: boolean;
  userLocation?: UserDot | null;
  onMoveStart?: () => void;
  onMoveEnd?: (center: LatLng) => void;
  className?: string;
  ref?: Ref<MapCanvasHandle>;
}

export default function MapCanvas({
  initialCenter,
  initialZoom = DEFAULT_ZOOM,
  layer,
  interactive = true,
  userLocation,
  onMoveStart,
  onMoveEnd,
  className,
  ref,
}: MapCanvasProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const dotRef = useRef<L.LayerGroup | null>(null);
  const handlers = useRef({ onMoveStart, onMoveEnd });
  useEffect(() => {
    handlers.current = { onMoveStart, onMoveEnd };
  });

  // Create once
  useEffect(() => {
    if (!elRef.current) return;
    const map = L.map(elRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      touchZoom: interactive ? 'center' : false,
      scrollWheelZoom: interactive ? 'center' : false,
      doubleClickZoom: interactive ? 'center' : false,
      boxZoom: false,
      keyboard: interactive,
      tap: false,
    } as L.MapOptions);
    map.attributionControl.setPrefix(false);
    map.on('movestart', () => handlers.current.onMoveStart?.());
    map.on('moveend', () => {
      const c = map.getCenter();
      handlers.current.onMoveEnd?.({ lat: c.lat, lng: c.lng });
    });
    mapRef.current = map;
    // The container may get its size after the first paint (full-screen overlay)
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(elRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      tilesRef.current = null;
      dotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Streets / satellite
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tilesRef.current?.remove();
    const t = TILE_LAYERS[layer];
    tilesRef.current = L.tileLayer(t.url, {
      attribution: t.attribution,
      maxZoom: t.maxZoom,
      maxNativeZoom: t.maxNativeZoom,
      crossOrigin: true,
    }).addTo(map);
    map.setMaxZoom(t.maxZoom);
  }, [layer]);

  // The blue dot where the phone is
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    dotRef.current?.remove();
    dotRef.current = null;
    if (!userLocation) return;
    const group = L.layerGroup();
    if (userLocation.accuracy && userLocation.accuracy < 2000) {
      L.circle([userLocation.lat, userLocation.lng], {
        radius: userLocation.accuracy,
        color: '#2563eb',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(group);
    }
    L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#2563eb',
      fillOpacity: 1,
      interactive: false,
    }).addTo(group);
    group.addTo(map);
    dotRef.current = group;
  }, [userLocation]);

  useImperativeHandle(
    ref,
    () => ({
      flyTo(point, zoom) {
        const map = mapRef.current;
        if (!map) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        map.flyTo([point.lat, point.lng], zoom ?? Math.max(map.getZoom(), DEFAULT_ZOOM), {
          animate: !reduce,
          duration: 0.8,
        });
      },
      getCenter() {
        const c = mapRef.current?.getCenter();
        return c ? { lat: c.lat, lng: c.lng } : initialCenter;
      },
    }),
    [initialCenter]
  );

  return <div ref={elRef} className={className} dir="ltr" role="application" aria-label="الخريطة" />;
}
