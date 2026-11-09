import { dialogTabStops, isTopDialog } from '@/utils/dialogFocus';
import { validOrderPoint } from '@/utils/orderLocation';
// ─── "تأكيد الموقع" – full-screen map like Talabat, then the address details
// The map moves under a fixed pin; مكاني, streets/satellite, search and back on top;
// "أدخل العنوان بالكامل" opens the details form, then onSave gets the address.
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { AddressDraft, LatLng } from '@/types';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import { GEO_MESSAGES, useGeolocation } from '@/hooks/useGeolocation';
import { geocoder, type PlaceResult } from '@/services/maps/geocoder';
import { DEFAULT_ZOOM, PICK_ZOOM, villageCenter, type MapLayer } from '@/services/maps/config';
import type { MapCanvasHandle } from '@/services/maps/MapCanvas';
import AddressDetailsForm from './AddressDetailsForm';

const MapCanvas = lazy(() => import('@/services/maps/MapCanvas'));

export interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  /** Editing an address: start from it. */
  initial?: Partial<AddressDraft> | null;
  /** The customer's village: the map opens there when we don't know more. */
  village?: string;
  /** Where that village is on the map (from the village list), when we know it. */
  villageCenter?: LatLng | null;
  /** Fills رقم الموبايل when the address has none. */
  defaultPhone?: string;
  /** Show "خلّيه العنوان الأساسي" in the form. */
  showDefaultToggle?: boolean;
  defaultChecked?: boolean;
  saveLabel?: string;
  /** Throw to keep the form open; the message is shown. */
  onSave: (draft: AddressDraft, makeDefault: boolean) => Promise<void> | void;
}

type Step = 'map' | 'details';

const stopReact = { onTouchStart: stop, onTouchEnd: stop, onTouchMove: stop, onClick: stop, onKeyDown: stop };
function stop(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export default function LocationPicker(props: LocationPickerProps) {
  if (!props.open) return null;
  return createPortal(<PickerScreen {...props} />, document.body);
}

function PickerScreen({
  onClose,
  initial,
  village,
  villageCenter: knownCenter,
  defaultPhone = '',
  showDefaultToggle = false,
  defaultChecked = false,
  saveLabel,
  onSave,
}: LocationPickerProps) {
  const hasInitialPoint = validOrderPoint(initial);
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => { requestAnimationFrame(() => {
      if (previous?.isConnected && previous !== document.body) previous.focus({ preventScroll: true });
      else {
        const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')].filter(el => el.getClientRects().length > 0);
        const parent = dialogs.at(-1);
        if (parent) (parent.querySelector<HTMLElement>('[tabindex="-1"]') ?? dialogTabStops(parent)[0])?.focus({ preventScroll: true });
      }
    }); };
  }, []);
  const [startCenter] = useState<LatLng>(() =>
    hasInitialPoint ? { lat: initial!.lat!, lng: initial!.lng! } : (knownCenter ?? villageCenter(village))
  );
  const [step, setStep] = useState<Step>('map');
  const [center, setCenter] = useState<LatLng>(startCenter);
  const [moving, setMoving] = useState(false);
  const [layer, setLayer] = useState<MapLayer>('streets');
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [placeLoading, setPlaceLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const mapRef = useRef<MapCanvasHandle>(null);
  const geo = useGeolocation();
  const asked = useRef(false);

  useBackButtonClose(true, onClose);
  useBackButtonClose(step === 'details', () => setStep('map'));
  useBackButtonClose(searchOpen, () => setSearchOpen(false));

  // Escape: one layer at a time, and never the modal underneath
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      e.stopPropagation();
      if (searchOpen) setSearchOpen(false);
      else if (step === 'details') setStep('map');
      else onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [searchOpen, step, onClose]);

  // Lock the page behind
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const { locate } = geo;
  const goToMe = useCallback(async () => {
    const dot = await locate();
    if (dot) mapRef.current?.flyTo(dot, PICK_ZOOM);
  }, [locate]);

  // First time: go to the phone's location if already allowed; if the browser would ask,
  // explain first. Browsers that don't say (no Permissions API) get the explanation after a moment.
  const [permWaitOver, setPermWaitOver] = useState(false);
  const [askDismissed, setAskDismissed] = useState(false);
  useEffect(() => {
    if (asked.current || hasInitialPoint || geo.permission !== 'granted') return;
    asked.current = true;
    void goToMe();
  }, [geo.permission, hasInitialPoint, goToMe]);
  useEffect(() => {
    const t = setTimeout(() => setPermWaitOver(true), 1200);
    return () => clearTimeout(t);
  }, []);
  const askLocation =
    !hasInitialPoint &&
    !askDismissed &&
    geo.status === 'idle' &&
    (geo.permission === 'prompt' || (geo.permission === 'unknown' && permWaitOver));

  // The map, permission explanation and place search share one focus boundary.
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const scope = () => screen.querySelector<HTMLElement>('[data-picker-focus-scope]') ?? screen;
    const activeScope = scope();
    if (!activeScope.contains(document.activeElement)) activeScope.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !isTopDialog(screen)) return;
      const boundary = scope();
      const stops = dialogTabStops(boundary);
      const first = stops[0], last = stops.at(-1), active = document.activeElement;
      if (!first) { event.preventDefault(); boundary.focus(); }
      else if (event.shiftKey && (active === first || active === boundary || !boundary.contains(active))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (active === last || !boundary.contains(active))) { event.preventDefault(); first.focus(); }
    };
    const contain = (event: FocusEvent) => {
      if (isTopDialog(screen) && event.target instanceof Node && !scope().contains(event.target)) scope().focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', contain);
    return () => { window.removeEventListener('keydown', onKey, true); document.removeEventListener('focusin', contain); };
  }, [askLocation, searchOpen, step]);

  // Name of the spot under the pin, 0.8 s after the map stops
  useEffect(() => {
    if (moving) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      geocoder
        .reverse(center, ctrl.signal)
        .then((p) => setPlace(p))
        .catch((err) => {
          if ((err as Error)?.name !== 'AbortError') setPlace(null);
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setPlaceLoading(false);
        });
    }, 800);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [center, moving]);

  const geoError = geo.status === 'denied' || geo.status === 'unavailable' || geo.status === 'timeout' || geo.status === 'unsupported'
    ? GEO_MESSAGES[geo.status]
    : '';

  return (
    <div
      ref={screenRef}
      tabIndex={-1}
      className="outline-none fixed inset-0 z-[260] bg-cream text-right flex flex-col h-dvh animate-[fadeIn_0.15s_ease]"
      role="dialog"
      aria-modal="true"
      aria-label={step === 'map' ? 'تأكيد الموقع' : 'تفاصيل العنوان'}
      dir="rtl"
      {...stopReact}
    >
      {/* The map stays mounted under the form so going back is instant */}
      <div className={step === 'map' ? 'relative flex-1 min-h-0' : 'hidden'}>
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-text-muted">بنحمّل الخريطة…</div>}>
          <MapCanvas
            ref={mapRef}
            className="map-picker absolute inset-0 z-0 bg-[#e8eee9]"
            initialCenter={startCenter}
            initialZoom={hasInitialPoint ? PICK_ZOOM : DEFAULT_ZOOM}
            layer={layer}
            userLocation={geo.position}
            onMoveStart={() => setMoving(true)}
            onMoveEnd={(c) => {
              setMoving(false);
              setPlaceLoading(true);
              setCenter(c);
            }}
          />
        </Suspense>

        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-[500] pt-[max(0.75rem,env(safe-area-inset-top))] px-3 flex items-center gap-2 pointer-events-none">
          <RoundButton label="ابحث عن مكان" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </RoundButton>
          <h1 className="flex-1 text-center font-black text-green-dark text-lg drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
            <span className="bg-white/90 rounded-full px-4 py-1.5 shadow-sm">تأكيد الموقع</span>
          </h1>
          <RoundButton label="رجوع" onClick={onClose}>
            <BackIcon />
          </RoundButton>
        </div>

        {/* Fixed pin in the middle */}
        <div className="absolute inset-0 z-[400] pointer-events-none grid place-items-center" aria-hidden="true">
          <div className="relative flex flex-col items-center -translate-y-[26px]">
            <div
              className={`absolute bottom-[calc(100%+10px)] whitespace-nowrap bg-green-dark text-white text-[13px] font-bold px-3.5 py-2 rounded-xl shadow-lg transition-all duration-200 ${
                moving ? 'opacity-0 translate-y-1' : 'opacity-100'
              }`}
            >
              هنوصّل طلبك للمكان ده
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-green-dark" />
            </div>
            <div className={`transition-transform duration-200 ${moving ? '-translate-y-3' : ''}`}>
              <PinIcon />
            </div>
          </div>
          <span
            className={`absolute w-2.5 h-2.5 rounded-full bg-black/35 blur-[1px] transition-all duration-200 ${
              moving ? 'scale-150 opacity-60' : ''
            }`}
          />
        </div>

        {/* Map buttons, left side like Talabat */}
        <div className="absolute left-3 bottom-[calc(10.5rem+env(safe-area-inset-bottom))] z-[500] flex flex-col gap-2.5">
          <RoundButton
            label={layer === 'streets' ? 'عرض القمر الصناعي' : 'عرض الشوارع'}
            onClick={() => setLayer((l) => (l === 'streets' ? 'satellite' : 'streets'))}
            active={layer === 'satellite'}
          >
            <LayersIcon />
          </RoundButton>
          <RoundButton label="مكاني دلوقتي" onClick={goToMe} busy={geo.status === 'locating'}>
            <MyLocationIcon />
          </RoundButton>
        </div>

        {/* Bottom sheet */}
        <div className="absolute bottom-0 inset-x-0 z-[500] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {geoError && (
            <div className="mb-3 flex items-start gap-2 bg-gold/10 border border-gold-light rounded-xl p-2.5 text-[13px] text-brown leading-relaxed" role="alert">
              <span className="flex-1">{geoError}</span>
              <button type="button" onClick={geo.clearError} className="text-text-muted font-bold px-1" aria-label="اقفل الرسالة">
                ✕
              </button>
            </div>
          )}
          <div className="flex items-start gap-3 mb-3 min-h-[3rem]" aria-live="polite">
            <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-green/10 text-green grid place-items-center">
              <PinSmallIcon />
            </span>
            <div className="flex-1 min-w-0">
              {moving || (placeLoading && !place) ? (
                <>
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="font-bold text-text truncate">{place?.title || 'المكان اللي عليه الدبوس'}</p>
                  <p className="text-sm text-text-muted truncate">{place?.subtitle || 'حرّك الخريطة لحد ما الدبوس يبقى على بيتك بالظبط'}</p>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={moving}
            onClick={() => setStep('details')}
            className="w-full min-h-[52px] rounded-2xl bg-green text-white font-black text-lg shadow-md transition disabled:opacity-60"
          >
            أدخل العنوان بالكامل
          </button>
        </div>

        {askLocation && (
          <LocationPrompt onAllow={() => { setAskDismissed(true); void goToMe(); }} onSkip={() => setAskDismissed(true)} />
        )}

        {searchOpen && (
          <SearchPanel
            onClose={() => setSearchOpen(false)}
            onPick={(p) => {
              setSearchOpen(false);
              setPlace(p);
              mapRef.current?.flyTo(p, PICK_ZOOM);
            }}
          />
        )}
      </div>

      {step === 'details' && (
        <AddressDetailsForm
          point={center}
          layer={layer}
          initial={initial}
          suggestedStreet={place?.road || ''}
          defaultPhone={defaultPhone}
          showDefaultToggle={showDefaultToggle}
          defaultChecked={defaultChecked}
          saveLabel={saveLabel}
          onBack={() => setStep('map')}
          onSave={onSave}
        />
      )}
    </div>
  );
}

// ─── "نحدد مكانك؟" – said before the browser asks, so the question isn't a surprise
function LocationPrompt({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  return (
    <div tabIndex={-1} data-picker-focus-scope className="outline-none absolute inset-0 z-[600] bg-black/40 flex items-end" role="alertdialog" aria-labelledby="loc-ask-title">
      <div className="w-full bg-white rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center animate-[springUp_0.3s_ease]">
        <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-green/10 text-green grid place-items-center">
          <MyLocationIcon size={28} />
        </div>
        <h2 id="loc-ask-title" className="font-black text-lg text-green-dark mb-1">نحدد مكانك؟</h2>
        <p className="text-sm text-text-muted leading-relaxed mb-4">
          علشان المندوب يوصلك بالظبط. هيظهرلك سؤال من المتصفح، دوس «السماح». مكانك مش بيتحفظ غير لما تحفظ العنوان.
        </p>
        <button type="button" onClick={onAllow} className="w-full min-h-[50px] rounded-2xl bg-green text-white font-black mb-2">
          حدّد مكاني
        </button>
        <button type="button" onClick={onSkip} className="w-full min-h-[44px] rounded-2xl text-green-dark font-bold">
          هحدده بنفسي على الخريطة
        </button>
      </div>
    </div>
  );
}

// ─── Search a place (runs when بحث is pressed, as Nominatim asks)
function SearchPanel({ onClose, onPick }: { onClose: () => void; onPick: (p: PlaceResult) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ctrl = useRef<AbortController | null>(null);
  const lastQuery = useRef('');

  useEffect(() => () => ctrl.current?.abort(), []);

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    const query = q.trim();
    if (query.length < 2 || (query === lastQuery.current && results)) return;
    lastQuery.current = query;
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setLoading(true);
    setError('');
    try {
      setResults(await geocoder.search(query, ctrl.current.signal));
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setError('البحث ماشتغلش دلوقتي، جرّب تاني أو حرّك الخريطة بإيدك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div tabIndex={-1} data-picker-focus-scope className="outline-none absolute inset-0 z-[700] bg-white flex flex-col">
      <form onSubmit={run} className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-gray-100">
        <button type="button" onClick={onClose} className="w-11 h-11 grid place-items-center rounded-full text-green-dark" aria-label="رجوع للخريطة">
          <BackIcon />
        </button>
        <input
          autoFocus
          type="search"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن شارع أو مكان أو قرية"
          className="flex-1 min-w-0 h-11 rounded-xl bg-cream px-3 text-[16px] outline-none focus:ring-2 focus:ring-green/40"
          aria-label="ابحث عن مكان"
        />
        <button type="submit" disabled={loading || q.trim().length < 2} className="h-11 px-4 rounded-xl bg-green text-white font-bold disabled:opacity-50">
          بحث
        </button>
      </form>
      <div className="flex-1 overflow-y-auto" aria-live="polite">
        {loading && <p className="p-5 text-center text-text-muted">بندوّر…</p>}
        {error && <p className="p-5 text-center text-danger">{error}</p>}
        {!loading && !error && results?.length === 0 && (
          <p className="p-5 text-center text-text-muted leading-relaxed">
            ملقيناش حاجة بالاسم ده. جرّب اسم القرية أو المركز، وبعدين حرّك الخريطة لحد بيتك.
          </p>
        )}
        {!loading && results === null && !error && (
          <p className="p-5 text-center text-text-muted text-sm">اكتب الاسم ودوس «بحث»</p>
        )}
        <ul>
          {results?.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className="w-full flex items-start gap-3 px-4 py-3 text-right border-b border-gray-50"
              >
                <span className="mt-1 text-green"><PinSmallIcon /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-text truncate">{r.title}</span>
                  <span className="block text-sm text-text-muted truncate">{r.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[11px] text-text-muted text-center py-2" dir="ltr">Search © OpenStreetMap contributors</p>
    </div>
  );
}

// ─── Small pieces
function RoundButton({
  label,
  onClick,
  children,
  active = false,
  busy = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={`pointer-events-auto w-12 h-12 shrink-0 rounded-full grid place-items-center shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition ${
        active ? 'bg-green text-white' : 'bg-white text-green-dark'
      } ${busy ? 'animate-pulse' : ''}`}
    >
      {children}
    </button>
  );
}

function PinIcon() {
  return (
    <svg width="44" height="54" viewBox="0 0 44 54" fill="none" className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
      <path d="M22 53C22 53 42 33.6 42 21A20 20 0 1 0 2 21C2 33.6 22 53 22 53Z" fill="#1a7a4a" stroke="#fff" strokeWidth="2.5" />
      <circle cx="22" cy="21" r="7.5" fill="#fff" />
      <circle cx="22" cy="21" r="3.5" fill="#f0a500" />
    </svg>
  );
}

function PinSmallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** Points right: "back" in an Arabic layout. */
export function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

function MyLocationIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <path d="M12 1.5V5M12 19v3.5M1.5 12H5M19 12h3.5" />
    </svg>
  );
}
