// ─── "أضف وظيفة" and "عدّل الإعلان": both go to the admin before they show
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { ROUTES, jobPath } from '@/routes';
import { jobRepo } from '@/repositories';
import { VillagePicker } from '@/components/address/VillagePicker';
import { JOB_TYPES } from '@/config/jobs';
import { jobFormSchema } from '@/utils/jobForm';
import { fieldErrorsFrom } from '@/utils/validators';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { AuthField, PhoneField } from '@/pages/Auth/AuthLayout';
import type { JobDraft } from '@/repositories/jobs/types';
import { BackLink, SafetyNote } from './parts';
import { primaryBtn } from './jobUi';

type Values = JobDraft;

const EMPTY: Values = {
  title: '',
  employer: '',
  village: '',
  type: 'full_time',
  hours: '',
  salary: '',
  description: '',
  phone: '',
  whatsapp: true,
};

export default function JobFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const user = useAuthStore(selectUser);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showToast = useUIStore((s) => s.showToast);
  const [values, setValues] = useState<Values>(() => ({
    ...EMPTY,
    village: user?.village ?? '',
    phone: user?.phone ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!id || !user) return;
    let alive = true;
    jobRepo
      .get(id)
      .then((job) => {
        if (!alive) return;
        if (!job || job.ownerId !== user.id) {
          navigate(ROUTES.jobsMine, { replace: true });
          return;
        }
        const { title, employer, village, type, hours, salary, description, phone, whatsapp } = job;
        setValues({ title, employer, village, type, hours, salary, description, phone, whatsapp });
        setLoading(false);
      })
      .catch(() => alive && navigate(ROUTES.jobsMine, { replace: true }));
    return () => {
      alive = false;
    };
  }, [id, user, navigate]);

  if (!user) return <Navigate to={ROUTES.login} state={{ from: pathname }} replace />;

  const set =
    <K extends keyof Values>(key: K) =>
    (value: Values[K]) => {
      setValues((v) => ({ ...v, [key]: value }));
      if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parsed = jobFormSchema.safeParse(values);
    if (!parsed.success) {
      const next = fieldErrorsFrom(parsed.error.issues);
      setErrors(next);
      const first = Object.keys(next)[0];
      document.getElementById(`job-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const job = editing ? await jobRepo.update(id!, parsed.data) : await jobRepo.create(user.id, parsed.data);
      showToast(editing ? 'اتحفظ التعديل، وراح للمراجعة' : 'الإعلان وصل، وهيظهر بعد مراجعة الإدارة');
      navigate(jobPath(job.id), { replace: true });
    } catch (err) {
      setFormError(err instanceof Error && err.message ? err.message : 'الإعلان مااتحفظش، جرّب تاني');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" dir="rtl">
      <BackLink to={editing ? jobPath(id!) : ROUTES.jobs} label={editing ? 'الإعلان' : 'الوظائف'} />
      <h1 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-green-dark m-0 mt-1">
        {editing ? '✏️ عدّل الإعلان' : '💼 أضف وظيفة'}
      </h1>
      <p className="text-[13px] text-text-muted mt-1 mb-4">
        {editing
          ? 'بعد التعديل الإعلان هيروح للمراجعة تاني قبل ما يظهر.'
          : 'الإدارة بتراجع كل إعلان قبل ما يظهر، وبيفضل منشور 30 يوم وتقدر تجدّده.'}
      </p>

      {loading ? (
        <div className="h-[420px] bg-white rounded-2xl animate-pulse" aria-busy="true" />
      ) : (
        <form onSubmit={submit} noValidate className="bg-white rounded-2xl p-4 shadow-sm">
          <AuthField
            id="job-title"
            label="اسم الشغلانة"
            placeholder="مثلًا: بائع في سوبر ماركت"
            maxLength={80}
            value={values.title}
            onChange={(e) => set('title')(e.target.value)}
            error={errors.title}
          />
          <AuthField
            id="job-employer"
            label="اسم المحل أو صاحب الشغل"
            placeholder="مثلًا: صيدلية الشفاء"
            maxLength={80}
            value={values.employer}
            onChange={(e) => set('employer')(e.target.value)}
            error={errors.employer}
          />
          <VillagePicker
            id="job-village"
            label="القرية اللي فيها الشغل"
            value={values.village}
            onChange={(next) => set('village')(next)}
            error={errors.village}
          />

          <fieldset className="form-group border-0 p-0 m-0">
            <legend className="font-bold text-[14px] mb-2">نوع الشغل</legend>
            <div className="grid grid-cols-3 gap-2">
              {JOB_TYPES.map((t) => (
                <label
                  key={t.id}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] rounded-xl border-2 cursor-pointer text-[13px] font-bold text-center ${
                    values.type === t.id ? 'border-green bg-[#E6F4EC] text-green-dark' : 'border-[#e5e7eb]'
                  }`}
                >
                  <input
                    type="radio"
                    name="job-type"
                    value={t.id}
                    checked={values.type === t.id}
                    onChange={() => set('type')(t.id)}
                    className="sr-only"
                  />
                  <span aria-hidden="true">{t.icon}</span>
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          <AuthField
            id="job-hours"
            label="المواعيد (اختياري)"
            placeholder="مثلًا: من 9 الصبح لـ 5 العصر"
            maxLength={80}
            value={values.hours}
            onChange={(e) => set('hours')(e.target.value)}
            error={errors.hours}
          />
          <AuthField
            id="job-salary"
            label="المرتب (اختياري)"
            placeholder="مثلًا: 4000 جنيه في الشهر، أو 200 في اليوم"
            hint="لو سبته فاضي هيظهر «بالاتفاق»"
            maxLength={60}
            value={values.salary}
            onChange={(e) => set('salary')(e.target.value)}
            error={errors.salary}
          />

          <div className="form-group">
            <label htmlFor="job-description">تفاصيل الشغل</label>
            <textarea
              id="job-description"
              rows={5}
              maxLength={1000}
              placeholder="إيه الشغل، ومحتاج مين، ولو فيه شروط زي السن أو الخبرة"
              value={values.description}
              onChange={(e) => set('description')(e.target.value)}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? 'job-description-error' : undefined}
            />
            <span className="text-[11px] text-text-muted">{values.description.trim().length} / 1000</span>
            {errors.description && (
              <span id="job-description-error" className="input-error-msg" role="alert">
                {errors.description}
              </span>
            )}
          </div>

          <PhoneField
            id="job-phone"
            label="رقم التواصل"
            hint="الناس هتتصل بيك على الرقم ده"
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
            <SafetyNote compact />
          </div>

          {formError && (
            <p className="input-error-msg mb-2" role="alert">
              {formError}
            </p>
          )}
          <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
            {saving ? 'بنحفظ…' : editing ? 'احفظ التعديل' : 'ابعت الإعلان للمراجعة'}
          </button>
        </form>
      )}
    </div>
  );
}
