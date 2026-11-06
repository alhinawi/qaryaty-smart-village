// ─── /market/new?kind=sale|swap and /market/item/:id/edit: post or edit a listing
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { Camera, X } from 'lucide-react';
import { marketRepo, type ListingDraft, type ListingKind } from '@/repositories';
import {
  KIND_INFO,
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  MAX_PHOTOS,
  parsePrice,
  validateListingDraft,
} from '@/config/market';
import { ROUTES, marketItemPath } from '@/routes';
import { useUIStore } from '@/stores/useUIStore';
import { normalizeEgyptianPhone } from '@/utils/validators';
import { compressImage, ImageError } from '@/utils/compressImage';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { VillagePicker } from '@/components/address/VillagePicker';
import { BackBar, SafetyNote, useMarketUser, usePageTitle } from './shared';

interface PhotoItem {
  /** Bucket path once uploaded ('' while uploading) */
  path: string;
  /** What the form shows */
  preview: string;
  uploading: boolean;
  key: string;
}

function emptyDraft(kind: ListingKind, village: string, phone: string): ListingDraft {
  return {
    kind,
    title: '',
    category: '',
    condition: '',
    village,
    description: '',
    price: null,
    negotiable: false,
    wanted: '',
    photos: [],
    showPhone: false,
    contactPhone: phone,
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span id={id} className="input-error-msg" role="alert">
      {message}
    </span>
  ) : null;
}

export default function MarketFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const [params] = useSearchParams();
  const kindParam: ListingKind = params.get('kind') === 'swap' ? 'swap' : 'sale';
  const user = useMarketUser();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);

  const [draft, setDraft] = useState<ListingDraft>(() => emptyDraft(kindParam, user?.village ?? '', user?.phone ?? ''));
  const [priceText, setPriceText] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [notFound, setNotFound] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Photos uploaded in this visit and not saved: removed if the form is left */
  const fresh = useRef<Set<string>>(new Set());
  const saved = useRef(false);
  const originalPhotos = useRef<string[]>([]);

  const info = KIND_INFO[draft.kind];
  usePageTitle(editing ? 'تعديل الإعلان • قريتي' : `إعلان جديد • ${info.title}`);

  // Editing: load the post (only its owner gets here)
  useEffect(() => {
    if (!editing || !id || !user) return;
    let alive = true;
    marketRepo
      .get(id)
      .then((l) => {
        if (!alive) return;
        if (!l || l.ownerId !== user.id) {
          setNotFound(true);
          return;
        }
        setDraft({
          kind: l.kind,
          title: l.title,
          category: l.category,
          condition: l.condition,
          village: l.village,
          description: l.description,
          price: l.price,
          negotiable: l.negotiable,
          wanted: l.wanted,
          photos: l.photoPaths,
          showPhone: !!l.contactPhone,
          contactPhone: l.contactPhone ?? user.phone ?? '',
        });
        setPriceText(l.price != null ? String(l.price) : '');
        originalPhotos.current = l.photoPaths;
        setPhotos(l.photoPaths.map((p, i) => ({ path: p, preview: l.photos[i], uploading: false, key: p })));
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [editing, id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving without saving: drop the photos uploaded in this visit
  useEffect(
    () => () => {
      if (!saved.current && fresh.current.size) void marketRepo.deletePhotos([...fresh.current]);
    },
    []
  );

  if (!user) {
    const here = window.location.pathname + window.location.search;
    return <Navigate to={ROUTES.login} state={{ from: here }} replace />;
  }
  if (notFound) {
    return (
      <section className="max-w-[640px] mx-auto">
        <BackBar title="تعديل الإعلان" />
        <p className="bg-white rounded-2xl p-6 text-center shadow-card">الإعلان ده مش موجود أو مش بتاعك.</p>
      </section>
    );
  }

  const set = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key as string]) setErrors(({ [key as string]: _drop, ...rest }) => rest);
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      showToast(`${MAX_PHOTOS} صور بالكتير`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) showToast(`اتضاف ${room} بس، الحد ${MAX_PHOTOS} صور`);
    for (const file of picked) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      setPhotos((p) => [...p, { path: '', preview, uploading: true, key }]);
      try {
        const blob = await compressImage(file);
        const path = await marketRepo.uploadPhoto(user.id, blob);
        fresh.current.add(path);
        setPhotos((p) => p.map((x) => (x.key === key ? { ...x, path, uploading: false } : x)));
      } catch (e) {
        setPhotos((p) => p.filter((x) => x.key !== key));
        URL.revokeObjectURL(preview);
        showToast(e instanceof ImageError || e instanceof Error ? e.message : 'الصورة مااترفعتش');
      }
    }
    if (errors.photos) setErrors(({ photos: _p, ...rest }) => rest);
  };

  const removePhoto = (key: string) => {
    const item = photos.find((p) => p.key === key);
    setPhotos((p) => p.filter((x) => x.key !== key));
    if (item?.path && fresh.current.has(item.path)) {
      fresh.current.delete(item.path);
      void marketRepo.deletePhotos([item.path]);
    }
  };

  const makeCover = (key: string) => {
    setPhotos((p) => {
      const item = p.find((x) => x.key === key);
      return item ? [item, ...p.filter((x) => x.key !== key)] : p;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (photos.some((p) => p.uploading)) {
      setFormError('استنى لحد ما الصور تخلص رفع');
      return;
    }
    const final: ListingDraft = {
      ...draft,
      price: draft.kind === 'sale' ? parsePrice(priceText) : null,
      photos: photos.map((p) => p.path),
      contactPhone: draft.showPhone ? normalizeEgyptianPhone(draft.contactPhone) : '',
    };
    const found = validateListingDraft(final);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('راجع الخانات اللي بالأحمر');
      const first = document.querySelector<HTMLElement>(`[data-field="${Object.keys(found)[0]}"]`);
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      const listing = editing && id ? await marketRepo.update(id, final) : await marketRepo.create(final);
      saved.current = true;
      // Photos taken off the post while editing
      const dropped = originalPhotos.current.filter((p) => !final.photos.includes(p));
      if (dropped.length) void marketRepo.deletePhotos(dropped);
      showToast(editing ? '✅ التعديل اتحفظ' : '✅ إعلانك اتنشر');
      navigate(marketItemPath(listing.id), { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'حصلت مشكلة، جرّب تاني');
    } finally {
      setSaving(false);
    }
  };

  const chip = (selected: boolean) =>
    `min-h-[40px] px-3 rounded-xl text-[13px] font-bold border transition-colors ${
      selected ? 'bg-green text-white border-green' : 'bg-white text-text border-[rgba(26,122,74,0.18)]'
    }`;

  return (
    <section className="max-w-[640px] mx-auto pb-10">
      <BackBar title={editing ? 'تعديل الإعلان' : draft.kind === 'sale' ? 'اعرض حاجة للبيع' : 'اعرض حاجة للتبادل'} />

      {loading ? (
        <p className="bg-white rounded-2xl p-6 text-center shadow-card" aria-busy="true">
          بيحمّل…
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl p-4 md:p-6 shadow-card flex flex-col gap-4">
          {!editing && (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="نوع الإعلان">
              {(['sale', 'swap'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={draft.kind === k}
                  onClick={() => set('kind', k)}
                  className={`${chip(draft.kind === k)} min-h-[48px] text-sm`}
                >
                  <span aria-hidden="true">{KIND_INFO[k].icon} </span>
                  {k === 'sale' ? 'بيع' : 'تبادل'}
                </button>
              ))}
            </div>
          )}

          {/* Photos */}
          <div data-field="photos">
            <p className="text-sm font-bold mb-1">
              الصور <span className="text-text-muted font-normal text-[12px]">(لحد {MAX_PHOTOS}، أول صورة هي الغلاف)</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {photos.map((p, i) => (
                <div key={p.key} className="relative aspect-square rounded-xl overflow-hidden bg-cream">
                  <img src={p.preview} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                  {p.uploading && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[12px] font-bold">
                      بيترفع…
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(p.key)}
                    className="absolute top-1 left-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label={`شيل الصورة ${i + 1}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                  {i === 0 ? (
                    <span className="absolute bottom-1 right-1 bg-green text-white text-[10px] font-bold rounded-full px-1.5">الغلاف</span>
                  ) : (
                    !p.uploading && (
                      <button
                        type="button"
                        onClick={() => makeCover(p.key)}
                        className="absolute bottom-1 right-1 bg-white/90 text-green-dark text-[10px] font-bold rounded-full px-1.5"
                      >
                        خليها الغلاف
                      </button>
                    )
                  )}
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-green/40 text-green flex flex-col items-center justify-center gap-1 text-[12px] font-bold bg-[#f3faf6]"
                >
                  <Camera className="w-6 h-6" aria-hidden="true" />
                  أضف صورة
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              data-testid="market-photo-input"
              onChange={(e) => {
                void addPhotos(e.target.files);
                e.target.value = '';
              }}
            />
            <p className="text-[12px] text-text-muted mt-1">الصور الواضحة بتخلّي الناس تسأل أكتر.</p>
            <FieldError id="photos-error" message={errors.photos} />
          </div>

          <div className="form-group" data-field="title">
            <label htmlFor="mk-title" className="text-sm font-bold text-green-dark">
              اسم الحاجة
            </label>
            <input
              id="mk-title"
              value={draft.title}
              maxLength={80}
              onChange={(e) => set('title', e.target.value)}
              placeholder={draft.kind === 'sale' ? 'مثلاً: تلاجة توشيبا 16 قدم' : 'مثلاً: عجلة أطفال مقاس 16'}
              className={`q-input ${errors.title ? 'is-invalid' : ''}`}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            <FieldError id="title-error" message={errors.title} />
          </div>

          <fieldset data-field="category">
            <legend className="text-sm font-bold mb-1.5">القسم</legend>
            <div className="flex flex-wrap gap-2">
              {LISTING_CATEGORIES.map((c) => (
                <button key={c.id} type="button" aria-pressed={draft.category === c.id} onClick={() => set('category', c.id)} className={chip(draft.category === c.id)}>
                  <span aria-hidden="true">{c.icon} </span>
                  {c.label}
                </button>
              ))}
            </div>
            <FieldError id="category-error" message={errors.category} />
          </fieldset>

          <fieldset data-field="condition">
            <legend className="text-sm font-bold mb-1.5">الحالة</legend>
            <div className="grid grid-cols-3 gap-2">
              {LISTING_CONDITIONS.map((c) => (
                <button key={c.id} type="button" aria-pressed={draft.condition === c.id} onClick={() => set('condition', c.id)} className={chip(draft.condition === c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <FieldError id="condition-error" message={errors.condition} />
          </fieldset>

          {draft.kind === 'sale' ? (
            <div className="flex flex-col gap-1.5" data-field="price">
              <label htmlFor="mk-price" className="text-sm font-bold text-green-dark">
                السعر (جنيه)
              </label>
              <input
                id="mk-price"
                inputMode="numeric"
                value={priceText}
                onChange={(e) => {
                  setPriceText(e.target.value);
                  if (errors.price) setErrors(({ price: _p, ...rest }) => rest);
                }}
                placeholder="مثلاً: 3500"
                className={`q-input ${errors.price ? 'is-invalid' : ''}`}
                aria-invalid={!!errors.price}
              />
              <FieldError id="price-error" message={errors.price} />
              <label className="flex items-center gap-2 mt-1 text-sm font-bold cursor-pointer">
                <input type="checkbox" checked={draft.negotiable} onChange={(e) => set('negotiable', e.target.checked)} className="w-5 h-5 accent-green" />
                قابل للتفاوض
              </label>
            </div>
          ) : (
            <div className="form-group" data-field="wanted">
              <label htmlFor="mk-wanted" className="text-sm font-bold text-green-dark">
                عايز تبدّلها بإيه؟
              </label>
              <input
                id="mk-wanted"
                value={draft.wanted}
                maxLength={200}
                onChange={(e) => set('wanted', e.target.value)}
                placeholder="مثلاً: كرسي مكتب، أو أي حاجة للمدرسة"
                className={`q-input ${errors.wanted ? 'is-invalid' : ''}`}
                aria-invalid={!!errors.wanted}
              />
              <FieldError id="wanted-error" message={errors.wanted} />
            </div>
          )}

          <div data-field="village">
            <VillagePicker id="mk-village" value={draft.village} onChange={(v) => set('village', v)} error={errors.village} hint="القرية اللي الحاجة موجودة فيها" />
          </div>

          <div className="form-group" data-field="description">
            <label htmlFor="mk-desc" className="text-sm font-bold text-green-dark">
              الوصف <span className="text-text-muted font-normal text-[12px]">(اختياري)</span>
            </label>
            <textarea
              id="mk-desc"
              rows={4}
              maxLength={1000}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="اكتب تفاصيل تهم اللي هيشتري: الماركة، المقاس، اشتريتها من قد إيه، فيها عيب ولا لأ…"
              className={`q-input ${errors.description ? 'is-invalid' : ''}`}
            />
            <FieldError id="desc-error" message={errors.description} />
          </div>

          <div data-field="contactPhone">
            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
              <input type="checkbox" checked={draft.showPhone} onChange={(e) => set('showPhone', e.target.checked)} className="w-5 h-5 accent-green" />
              اعرض رقمي للمكالمات وواتساب
            </label>
            <p className="text-[12px] text-text-muted mt-1">لو مش عايز رقمك يبان، الناس هتكلمك برسايل جوه قريتي بس.</p>
            {draft.showPhone && (
              <div className="form-group mt-2">
                <label htmlFor="mk-phone" className="text-sm font-bold text-green-dark">
                  رقم الموبايل
                </label>
                <PhoneInput
                  id="mk-phone"
                  value={draft.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  className={`q-input ${errors.contactPhone ? 'is-invalid' : ''}`}
                  aria-invalid={!!errors.contactPhone}
                />
                <FieldError id="phone-error" message={errors.contactPhone} />
              </div>
            )}
          </div>

          <SafetyNote compact />
          <p className="text-[12px] text-text-muted leading-relaxed">
            إعلانك هينزل على طول، وهيفضل ظاهر 30 يوم وتقدر تجدّده. ممنوع الحاجات الممنوعة قانونًا والأدوية والحيوانات المسروقة، وأي إعلان يتبلّغ عنه 3 مرات بيتخبّى لحد ما الإدارة تراجعه.
          </p>

          {formError && (
            <p className="text-red-600 text-sm font-bold" role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" disabled={saving} className="w-full">
            {saving ? 'ثانية…' : editing ? 'احفظ التعديل' : 'انشر الإعلان'}
          </Button>
        </form>
      )}
    </section>
  );
}
