// ─── "مكاني دلوقتي": the phone's location, with Arabic messages for every way it can fail
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserDot } from '@/services/maps/MapCanvas';

export type GeoStatus = 'idle' | 'locating' | 'ok' | 'denied' | 'unavailable' | 'timeout' | 'unsupported';
export type GeoPermission = 'granted' | 'prompt' | 'denied' | 'unknown';

export const GEO_MESSAGES: Record<Exclude<GeoStatus, 'idle' | 'locating' | 'ok'>, string> = {
  denied: 'المتصفح مانع تحديد مكانك. افتح الإذن من إعدادات المتصفح (علامة القفل جنب اللينك)، أو حرّك الخريطة بإيدك لحد بيتك.',
  unavailable: 'معرفناش نحدد مكانك. اتأكد إن اللوكيشن (GPS) شغال في الموبايل، أو حرّك الخريطة بإيدك.',
  timeout: 'تحديد المكان أخد وقت طويل. جرّب تاني في مكان مفتوح، أو حرّك الخريطة بإيدك.',
  unsupported: 'المتصفح ده مابيديش المكان. حرّك الخريطة بإيدك لحد بيتك.',
};

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [position, setPosition] = useState<UserDot | null>(null);
  const [permission, setPermission] = useState<GeoPermission>('unknown');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let perm: PermissionStatus | null = null;
    const onChange = () => perm && setPermission(perm.state as GeoPermission);
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((p) => {
        if (!mounted.current) return;
        perm = p;
        setPermission(p.state as GeoPermission);
        p.addEventListener?.('change', onChange);
      })
      .catch(() => undefined);
    return () => {
      mounted.current = false;
      perm?.removeEventListener?.('change', onChange);
    };
  }, []);

  const locate = useCallback((): Promise<UserDot | null> => {
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setStatus('unsupported');
      return Promise.resolve(null);
    }
    setStatus('locating');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dot = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          if (mounted.current) {
            setPosition(dot);
            setStatus('ok');
            setPermission('granted');
          }
          resolve(dot);
        },
        (err) => {
          if (mounted.current) {
            const s: GeoStatus = err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
            setStatus(s);
            if (s === 'denied') setPermission('denied');
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    });
  }, []);

  const clearError = useCallback(() => setStatus((s) => (s === 'ok' || s === 'locating' ? s : 'idle')), []);

  return { status, position, permission, locate, clearError };
}
