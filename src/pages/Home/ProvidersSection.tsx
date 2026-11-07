// ─── Providers list with teacher filters (subject, stage)
import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Atom,
  BookA,
  BookHeart,
  BookOpen,
  Calculator,
  Dna,
  Earth,
  FlaskConical,
  Landmark,
  Languages,
  Laptop,
  Microscope,
  SpellCheck,
  GraduationCap,
} from 'lucide-react';
import type { Provider, ProviderKind, SchoolStage, Service, TeacherSubject, TeacherGroup } from '@/types';
import { STAGES, SUBJECTS, SUBJECT_STAGES } from '@/data/teachers';
import { ProviderCard } from '@/components/shared/ProviderCard';
import type { DoctorSpecialty } from '@/utils/doctorSpecialties';
import { KIND_FILTER_LABELS, matchesProviderSearch, type PeopleSection } from '@/utils/peopleSections';

const SUBJECT_ICONS: Record<TeacherSubject, LucideIcon> = {
  arabic: BookOpen,
  english: Languages,
  math: Calculator,
  science: Microscope,
  history: Landmark,
  geography: Earth,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  french: BookA,
  german: SpellCheck,
  quran: BookHeart,
  computer: Laptop,
};

interface ProvidersSectionProps {
  section: PeopleSection;
  providers: Provider[];
  onBook: (provider: Provider, group?: TeacherGroup) => void;
  /** Show the filters (subject and stage for teachers, kind for doctors/nurses). */
  showFilters?: boolean;
  subject?: TeacherSubject | 'all';
  onSubjectChange?: (subject: TeacherSubject | 'all') => void;
  stage?: SchoolStage | 'all';
  onStageChange?: (stage: SchoolStage | 'all') => void;
  specialties?: DoctorSpecialty[];
  specialty?: string;
  onSpecialtyChange?: (specialty: string) => void;
  kind?: ProviderKind | 'all';
  onKindChange?: (kind: ProviderKind | 'all') => void;
  /** "مش فارق معاك مين؟": general services to order without picking someone. */
  quickServices?: Service[];
  onQuickRequest?: (service: Service) => void;
  /** Search results on the home page: show the first few and a link to the whole section. */
  maxVisible?: number;
  onShowAll?: () => void;
}

function Chip({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors whitespace-nowrap ${
        active ? 'bg-green text-white border-green' : 'bg-white text-text border-gray-200 hover:border-green'
      }`}
    >
      {children}
    </button>
  );
}

export function ProvidersSection({
  section,
  providers,
  onBook,
  showFilters = false,
  subject = 'all',
  onSubjectChange,
  stage = 'all',
  onStageChange,
  specialties = [],
  specialty = 'all',
  onSpecialtyChange,
  kind = 'all',
  onKindChange,
  quickServices = [],
  onQuickRequest,
  maxVisible,
  onShowAll,
}: ProvidersSectionProps) {
  const titleId = `people-${section.id}-title`;
  const isTeachers = section.kinds.includes('teacher');
  const [query, setQuery] = useState('');
  const matched = useMemo(() => providers.filter(provider => matchesProviderSearch(provider, query)), [providers, query]);
  const visible = maxVisible ? matched.slice(0, maxVisible) : matched;
  const hiddenCount = matched.length - visible.length;
  const searchId = `people-${section.id}-search`;
  const hasFilters = specialty !== 'all' || subject !== 'all' || stage !== 'all' || kind !== 'all';

  return (
    <section className="mb-6 scroll-mt-40" id={`people-${section.id}`} aria-labelledby={titleId}>
      <div className="flex justify-between items-center mb-3 gap-2">
        <h2 id={titleId} className="text-[1.0625rem] font-extrabold font-['Tajawal',sans-serif] m-0">
          <span aria-hidden="true">{section.emoji}</span> {section.title} ({matched.length})
        </h2>
        {onShowAll && hiddenCount > 0 && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-sm font-bold text-green bg-transparent border-none cursor-pointer whitespace-nowrap"
          >
            عرض الكل
          </button>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor={searchId} className="block text-sm font-bold text-green-dark mb-2">دوّر في {section.title}</label>
        <div className="flex items-center gap-2 rounded-xl border border-green/25 bg-white px-3 min-h-12">
          <input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="اكتب الاسم أو التخصص…" className="flex-1 min-w-0 bg-transparent outline-none text-base py-3" />
          {query && <button type="button" onClick={() => setQuery('')} className="min-h-11 px-2 text-sm font-bold text-green" aria-label={`امسح البحث في ${section.title}`}>مسح</button>}
        </div>
        {query.trim() && <p role="status" className="text-xs text-text-muted mt-2">{matched.length} نتيجة بالبحث والفلاتر الحالية</p>}
      </div>

      {showFilters && isTeachers && onSubjectChange && onStageChange && (
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="المادة">
            <Chip active={subject === 'all'} onClick={() => onSubjectChange('all')}>
              <GraduationCap size={14} aria-hidden="true" /> كل المواد
            </Chip>
            {SUBJECTS.filter(({ id }) => stage === 'all' || SUBJECT_STAGES[id].includes(stage)).map(({ id, label }) => {
              const Icon = SUBJECT_ICONS[id];
              return (
                <Chip key={id} active={subject === id} onClick={() => onSubjectChange(id)}>
                  <Icon size={14} aria-hidden="true" /> {label}
                </Chip>
              );
            })}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="المرحلة">
            <Chip active={stage === 'all'} onClick={() => onStageChange('all')}>
              كل المراحل
            </Chip>
            {STAGES.filter(({ id }) => subject === 'all' || SUBJECT_STAGES[subject].includes(id)).map(({ id, label }) => (
              <Chip key={id} active={stage === id} onClick={() => onStageChange(id)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {showFilters && section.kinds.length > 1 && onKindChange && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-4" role="group" aria-label="النوع">
          <Chip active={kind === 'all'} onClick={() => onKindChange('all')}>
            الكل
          </Chip>
          {section.kinds.map((id) => (
            <Chip key={id} active={kind === id} onClick={() => onKindChange(id)}>
              {KIND_FILTER_LABELS[id]}
            </Chip>
          ))}
        </div>
      )}

      {showFilters && section.id === 'health' && kind !== 'nurse' && onSpecialtyChange && (
        <div className="mb-4 rounded-2xl bg-white/70 border border-green/10 p-3">
          <p className="text-xs text-green-dark font-extrabold mb-1">تخصص الدكتور</p>
          <p className="text-[11px] text-text-muted mb-3">كل التخصصات موجودة للبحث. الرقم هو عدد الدكاترة الظاهرين في البيانات الحالية، مش تأكيد توافرهم.</p>
          <label className="block text-xs text-text-muted mb-2">اختار من كل التخصصات
            <select aria-label="كل تخصصات الدكاترة" value={specialty} onChange={event => onSpecialtyChange(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-text">
              <option value="all">كل التخصصات</option>{specialties.map(option => <option key={option.id} value={option.id}>{option.label} ({option.count})</option>)}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto py-1" role="group" aria-label="تخصص الدكتور">
            <Chip active={specialty === 'all'} onClick={() => onSpecialtyChange('all')}>الكل</Chip>
            {specialties.map(option => <button type="button" key={option.id} aria-pressed={specialty === option.id} onClick={() => onSpecialtyChange(option.id)} aria-label={`${option.label} (${option.count})`} className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold ${specialty === option.id ? 'bg-green text-white border-green' : option.count === 0 ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-white text-text border-gray-200'}`}>{option.label} <span className="text-[10px]">({option.count})</span></button>)}
          </div>
        </div>
      )}

      {quickServices.length > 0 && onQuickRequest && (
        <div className="bg-[#e8f5ee] rounded-2xl p-3 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-bold text-green-dark m-0">
            {isTeachers
              ? 'مش لاقي المادة أو مش فارق معاك مين؟ قولنا ونرشحلك مدرس.'
              : 'مش فارق معاك مين؟ اطلب ونبعتلك أقرب حد متاح.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {quickServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => onQuickRequest(service)}
                aria-label={`طلب ${service.name} من غير ما تختار حد`}
                className="bg-white text-green-dark border-2 border-green rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap hover:bg-green hover:text-white transition-colors"
              >
                {service.emoji} {quickLabel(service)}
              </button>
            ))}
          </div>
        </div>
      )}

      {matched.length === 0 ? (
        <div className="text-sm text-text-muted bg-white rounded-xl p-4 text-center" role="status">
          <p className="m-0">{query.trim() ? 'مفيش حد مطابق للبحث ده. جرّب اسم أو تخصص تاني، أو شيل الفلاتر.' : specialty !== 'all' ? 'لسه مفيش دكتور ظاهر في التخصص ده. ابعت طلبك وهنحاول نوصلك بحد مناسب.' : 'مفيش حد مطابق دلوقتي، جرّب فلتر تاني.'}</p>
          {specialty !== 'all' && onQuickRequest && quickServices.some(service => !service.name.includes('تمريض')) && <button type="button" className="mt-3 rounded-xl bg-green px-4 py-2 text-white font-bold" onClick={() => { const service = quickServices.find(item => !item.name.includes('تمريض')); if (service) onQuickRequest(service); }}>اطلب مساعدة في التخصص ده</button>}
          {query.trim() && <button type="button" onClick={() => setQuery('')} className="min-h-11 px-3 text-green font-bold">امسح البحث</button>}
          {hasFilters && showFilters && (
            <button
              type="button"
              onClick={() => {
                onSubjectChange?.('all');
                onStageChange?.('all');
                onKindChange?.('all');
                onSpecialtyChange?.('all');
              }}
              className="block mx-auto mt-3 text-green font-bold bg-transparent border-none cursor-pointer"
            >
              شيل الفلاتر
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visible.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} onBook={onBook} />
          ))}
        </div>
      )}

      {onShowAll && hiddenCount > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          className="w-full mt-3 bg-white border-2 border-gray-200 rounded-xl py-2.5 text-sm font-bold text-green-dark cursor-pointer hover:border-green"
        >
          عرض الـ {matched.length} كلهم في قسم {section.title}
        </button>
      )}
    </section>
  );
}

/** Short button text: "تمريض منزلي (ممرض / ممرضة)" → "تمريض منزلي". */
function quickLabel(service: Service): string {
  return service.name.replace(/\s*\(.*\)\s*/, '').trim() || service.name;
}
