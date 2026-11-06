// ─── "نزّل مشوار" and "عدّل المشوار": live at once, 3 reports hide a post
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { ROUTES, ridePath } from '@/routes';
import { rideRepo } from '@/repositories';
import { VillagePicker } from '@/components/address/VillagePicker';
import {
  RIDE_CAR_MAX_PRICE,
  RIDE_KINDS,
  RIDE_MAX_DAYS_AHEAD,
  RIDE_RIDERS,
  RIDE_SCHEDULES,
  WEEKDAYS,
  cairoDate,
} from '@/config/rides';
import { rideFormSchema } from '@/utils/rideForm';
import { fieldErrorsFrom } from '@/utils/validators';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { AuthField, PhoneField } from '@/pages/Auth/AuthLayout';
import type { RideDraft, RideKind } from '@/repositories/rides/types';
import { primaryBtn } from '@/pages/Jobs/jobUi';
import { BackLink, RideSafetyNote } from './parts';

const DAY = 24 * 60 * 60 * 1000;
const DESTINATIONS = ['المنصورة', 'جامعة المنصورة', 'موقف القاهرة', 'المستشفى', 'طلخا', 'ميت غمر'];

const EMPTY: RideDraft = {
  kind: 'taxi',
  fromVillage: '',
  toPlace: '',
  departTime: '07:30',
  returnTime: '',
  schedule: 'weekdays',
  days: [],
  rideDate: '',
  seats: 2,
  price: null,
  carType: '',
  notes: '',
  riders: 'any',
  phone: '',
  whatsapp: true,
};

const choice = (on: boolean) =>
  `flex items-center justify-center gap-1 min-h-[44px] px-2 rounded-xl border-2 cursor-pointer text-[13px] font-bold text-center ${
    on ? 'border-green bg-[#E6F4EC] text-green-dark' : 'border-[#e5e7eb]'
  }`;

export default function RideFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const [params] = useSearchParams();
  const user = useAuthStore(selectUser);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const showToast = useUIStore((s) => s.showToast);
  const [values, setValues] = useState<RideDraft>(() => {
    const kind: RideKind = params.get('kind') === 'car' ? 'car' : 'taxi';
    return {
      ...EMPTY,
      kind,
      seats: kind === 'car' ? 3 : 2,
      price: kind === 'car' ? 10 : null,
      fromVillage: user?.village ?? '',
      phone: user?.phone ?? '',
    };
  });
  const [priceText, setPriceText] = useState(values.price === null ? '' : String(values.price));
  const [hasReturn, setHasReturn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [{ today, lastDay }] = useState(() => {
    const now = Date.now();
    return { today: cairoDate(now), lastDay: cairoDate(now + RIDE_MAX_DAYS_AHEAD * DAY) };
  });

  useEffect(() => {
    document.title = `${editing ? 'عدّل المشوار' : 'نزّل مشوار'} | شير مواصلة`;
  }, [editing]);

  useEffect(() => {
    if (!id || !user) return;
    let alive = true;
    rideRepo
      .get(id)
      .then((ride) => {
        if (!alive) return;
        if (!ride || ride.ownerId !== user.id) {
          navigate(ROUTES.ridesMine, { replace: true });
          return;
        }
        const { kind, fromVillage, toPlace, departTime, returnTime, schedule, days, rideDate, seats, price, carType, notes, riders, phone, whatsapp } =
          ride;
        setValues({ kind, fromVillage, toPlace, departTime, returnTime, schedule, days, rideDate, seats, price, carType, notes, riders, phone, whatsapp });
        setPriceText(price === null ? '' : String(price));
        setHasReturn(!!returnTime);
        setLoading(false);
      })
      .catch(() => alive && navigate(ROUTES.ridesMine, { replace: true }));
    return () => {
      alive = false;
    };
  }, [id, user, navigate]);

  if (!user) return <Navigate to={ROUTES.login} state={{ from: pathname + search }} replace />;

  const set =
    <K extends keyof RideDraft>(key: K) =>
    (value: RideDraft[K]) => {
      setValues((v) => ({ ...v, [key]: value }));
      if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
    };

  const setKind = (kind: RideKind) => {
    setValues((v) => ({
      ...v,
      kind,
      seats: kind === 'taxi' ? Math.min(v.seats, 3) : v.seats,
      price: kind === 'car' && v.price === null ? 10 : v.price,
    }));
    if (kind === 'car' && priceText === '') setPriceText('10');
    setErrors({});
  };

  const toggleDay = (d: number) =>
    set('days')(values.days.includes(d) ? values.days.filter((x) => x !== d) : [...values.days, d].sort((a, b) => a - b));

  const isCar = values.kind === 'car';
  const maxSeats = isCar ? 6 : 3;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const draft: RideDraft = {
      ...values,
      returnTime: hasReturn ? values.returnTime : '',
      price: priceText.trim() === '' ? null : Number(priceText),
      rideDate: values.schedule === 'once' ? values.rideDate : '',
      days: values.schedule === 'days' ? values.days : [],
      carType: isCar ? values.carType : '',
    };
    if (draft.price !== null && !Number.isInteger(draft.price)) {
      setErrors({ price: 'اكتب السعر أرقام بس' });
      document.getElementById('ride-price')?.focus();
      return;
    }
    const parsed = rideFormSchema().safeParse(draft);
    if (!parsed.success) {
      const next = fieldErrorsFrom(parsed.error.issues);
      setErrors(next);
      const first = Object.keys(next)[0];
      document.getElementById(`ride-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const ride = editing ? await rideRepo.update(id!, parsed.data) : await rideRepo.create(user.id, parsed.data);
      showToast(editing ? 'اتحفظ التعديل' : 'مشوارك نزل، والناس تقدر تشوفه دلوقتي');
      navigate(ridePath(ride.id), { replace: true });
    } catch (err) {
      setFormError(err instanceof Error && err.message ? err.message : 'المشوار مااتحفظش، جرّب تاني');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" dir="rtl">
      <BackLink to={editing ? ridePath(id!) : ROUTES.rides} label={editing ? 'المشوار' : 'شير مواصلة'} />
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mt-1">
        {editing ? '✏️ عدّل المشوار' : '🚗 نزّل مشوارك'}
      </h1>
      <p className="text-[13px] text-text-muted mt-1 mb-4">
        المشوار بيظهر على طول، وبيفضل 30 يوم وتقدر تجدّده. المشوار اللي مرة واحدة بيختفي بعد يومه.
      </p>

      {loading ? (
        <div className="h-[520px] bg-white rounded-2xl animate-pulse" aria-busy="true" />
      ) : (
        <form onSubmit={submit} noValidate className="bg-white rounded-2xl p-4 shadow-sm">
          <fieldset className="form-group border-0 p-0 m-0" disabled={editing}>
            <legend className="font-bold text-[14px] mb-2">نوع المشوار{editing && ' (مايتغيّرش)'}</legend>
            <div className="grid grid-cols-2 gap-2">
              {RIDE_KINDS.map((k) => (
                <label
                  key={k.id}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[76px] p-2 rounded-xl border-2 cursor-pointer text-center ${
                    values.kind === k.id ? 'border-green bg-[#E6F4EC] text-green-dark' : 'border-[#e5e7eb]'
                  } ${editing && values.kind !== k.id ? 'opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="ride-kind"
                    value={k.id}
                    checked={values.kind === k.id}
                    onChange={() => setKind(k.id)}
                    className="sr-only"
                  />
                  <span className="text-xl" aria-hidden="true">
                    {k.icon}
                  </span>
                  <span className="text-[14px] font-extrabold">{k.label}</span>
                  <span className="text-[11px] text-text-muted leading-snug">{k.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <VillagePicker
            id="ride-fromVillage"
            label="طالع من"
            value={values.fromVillage}
            onChange={(next) => set('fromVillage')(next)}
            error={errors.fromVillage}
          />
          <AuthField
            id="ride-toPlace"
            label="رايح فين؟"
            placeholder="مثلًا: المنصورة - موقف القاهرة"
            maxLength={80}
            list="ride-destinations"
            value={values.toPlace}
            onChange={(e) => set('toPlace')(e.target.value)}
            error={errors.toPlace}
          />
          <datalist id="ride-destinations">
            {DESTINATIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          <div className="grid grid-cols-2 gap-2">
            <AuthField
              id="ride-departTime"
              label="ميعاد الطلوع"
              type="time"
              value={values.departTime}
              onChange={(e) => set('departTime')(e.target.value)}
              error={errors.departTime}
            />
            <div className="form-group">
              <label className="flex items-center gap-2 font-bold text-[14px] cursor-pointer min-h-[24px]">
                <input
                  type="checkbox"
                  checked={hasReturn}
                  onChange={(e) => {
                    setHasReturn(e.target.checked);
                    if (e.target.checked && !values.returnTime) set('returnTime')('15:00');
                  }}
                  className="w-4 h-4 accent-[#1a7a4a]"
                />
                وراجع كمان
              </label>
              {hasReturn ? (
                <input
                  id="ride-returnTime"
                  type="time"
                  aria-label="ميعاد الرجوع"
                  value={values.returnTime}
                  onChange={(e) => set('returnTime')(e.target.value)}
                  aria-invalid={errors.returnTime ? true : undefined}
                />
              ) : (
                <p className="text-[12px] text-text-muted m-0 mt-2">رايح بس</p>
              )}
              {errors.returnTime && (
                <span className="input-error-msg" role="alert">
                  {errors.returnTime}
                </span>
              )}
            </div>
          </div>

          <fieldset className="form-group border-0 p-0 m-0">
            <legend className="font-bold text-[14px] mb-2">الأيام</legend>
            <div className="grid grid-cols-2 gap-2">
              {RIDE_SCHEDULES.map((s) => (
                <label key={s.id} className={choice(values.schedule === s.id)}>
                  <input
                    type="radio"
                    name="ride-schedule"
                    className="sr-only"
                    checked={values.schedule === s.id}
                    onChange={() => {
                      set('schedule')(s.id);
                      if (s.id === 'once' && !values.rideDate) set('rideDate')(cairoDate(Date.now() + DAY));
                    }}
                  />
                  {s.label}
                </label>
              ))}
            </div>
            {values.schedule === 'days' && (
              <div className="flex flex-wrap gap-1.5 mt-2" id="ride-days" tabIndex={-1}>
                {WEEKDAYS.map((name, d) => (
                  <label key={name} className={`${choice(values.days.includes(d))} !min-h-[40px] !px-3`}>
                    <input type="checkbox" className="sr-only" checked={values.days.includes(d)} onChange={() => toggleDay(d)} />
                    {name}
                  </label>
                ))}
              </div>
            )}
            {values.schedule === 'once' && (
              <input
                id="ride-rideDate"
                type="date"
                aria-label="يوم المشوار"
                className="mt-2"
                min={today}
                max={lastDay}
                value={values.rideDate}
                onChange={(e) => set('rideDate')(e.target.value)}
                aria-invalid={errors.rideDate ? true : undefined}
              />
            )}
            {(errors.days || errors.rideDate) && (
              <span className="input-error-msg" role="alert">
                {errors.days || errors.rideDate}
              </span>
            )}
          </fieldset>

          <fieldset className="form-group border-0 p-0 m-0">
            <legend className="font-bold text-[14px] mb-2">{isCar ? 'كام كرسي فاضي؟' : 'محتاج كام واحد معاك؟'}</legend>
            <div className="flex gap-2" id="ride-seats" tabIndex={-1}>
              {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                <label key={n} className={`${choice(values.seats === n)} flex-1`}>
                  <input type="radio" name="ride-seats" className="sr-only" checked={values.seats === n} onChange={() => set('seats')(n)} />
                  {n}
                </label>
              ))}
            </div>
            {errors.seats && (
              <span className="input-error-msg" role="alert">
                {errors.seats}
              </span>
            )}
          </fieldset>

          <AuthField
            id="ride-price"
            label={isCar ? 'السعر الرمزي للكرسي (جنيه)' : 'نصيب الفرد التقريبي (اختياري)'}
            type="text"
            inputMode="numeric"
            placeholder={isCar ? 'مثلًا: 10، أو 0 لو ببلاش' : 'لو سبته فاضي: الأجرة بالتساوي'}
            hint={
              isCar
                ? `مساهمة في البنزين بس، بحد أقصى ${RIDE_CAR_MAX_PRICE} جنيه. ممنوع شغل التاكسي بأجرة.`
                : 'الأجرة بتتقسم على اللي راكبين.'
            }
            maxLength={3}
            value={priceText}
            onChange={(e) => {
              setPriceText(e.target.value.replace(/[^\d٠-٩]/g, '').replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660)));
              if (errors.price) setErrors((x) => ({ ...x, price: '' }));
            }}
            error={errors.price}
          />

          {isCar && (
            <AuthField
              id="ride-carType"
              label="نوع العربية ولونها (اختياري)"
              placeholder="مثلًا: فيرنا فضي"
              maxLength={40}
              value={values.carType}
              onChange={(e) => set('carType')(e.target.value)}
              error={errors.carType}
            />
          )}

          <fieldset className="form-group border-0 p-0 m-0">
            <legend className="font-bold text-[14px] mb-2">مين ينفع يركب؟</legend>
            <div className="grid grid-cols-3 gap-2">
              {RIDE_RIDERS.map((r) => (
                <label key={r.id} className={choice(values.riders === r.id)}>
                  <input type="radio" name="ride-riders" className="sr-only" checked={values.riders === r.id} onChange={() => set('riders')(r.id)} />
                  <span aria-hidden="true">{r.icon}</span>
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="ride-notes">ملاحظات (اختياري)</label>
            <textarea
              id="ride-notes"
              rows={3}
              maxLength={500}
              placeholder="مثلًا: بنتقابل عند الجامع الكبير، وبنزل عند بوابة الجامعة"
              value={values.notes}
              onChange={(e) => set('notes')(e.target.value)}
              aria-invalid={errors.notes ? true : undefined}
            />
            {errors.notes && (
              <span className="input-error-msg" role="alert">
                {errors.notes}
              </span>
            )}
          </div>

          <PhoneField
            id="ride-phone"
            label="رقم التواصل"
            hint="الناس هتكلمك على الرقم ده"
            value={values.phone}
            onChange={(e) => set('phone')(e.target.value)}
            error={errors.phone}
          />
          <label className="flex items-center gap-2 min-h-[44px] text-[14px] font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={values.whatsapp}
              onChange={(e) => set('whatsapp')(e.target.checked)}
              className="w-5 h-5 accent-[#1a7a4a]"
            />
            الرقم عليه واتساب
          </label>

          <div className="my-3">
            <RideSafetyNote compact />
          </div>

          {formError && (
            <p className="input-error-msg mb-2" role="alert">
              {formError}
            </p>
          )}
          <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
            {saving ? 'بنحفظ…' : editing ? 'احفظ التعديل' : 'نزّل المشوار'}
          </button>
        </form>
      )}
    </div>
  );
}
