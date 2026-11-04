// ─── Providers list with teacher filters (subject, stage)
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
import type { Provider, SchoolStage, TeacherSubject } from '@/types';
import { STAGES, SUBJECTS } from '@/data/teachers';
import { ProviderCard } from '@/components/shared/ProviderCard';

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
  title: string;
  providers: Provider[];
  onBook: (provider: Provider) => void;
  /** Show the teacher filters (subject and stage). */
  showTeacherFilters?: boolean;
  subject: TeacherSubject | 'all';
  onSubjectChange: (subject: TeacherSubject | 'all') => void;
  stage: SchoolStage | 'all';
  onStageChange: (stage: SchoolStage | 'all') => void;
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
  title,
  providers,
  onBook,
  showTeacherFilters = false,
  subject,
  onSubjectChange,
  stage,
  onStageChange,
}: ProvidersSectionProps) {
  return (
    <section className="mb-6" aria-labelledby="providers-title">
      <h3 id="providers-title" className="text-[1.0625rem] font-extrabold font-['Tajawal',sans-serif] mb-3">
        {title} ({providers.length})
      </h3>

      {showTeacherFilters && (
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="المادة">
            <Chip active={subject === 'all'} onClick={() => onSubjectChange('all')}>
              <GraduationCap size={14} aria-hidden="true" /> كل المواد
            </Chip>
            {SUBJECTS.map(({ id, label }) => {
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
            {STAGES.map(({ id, label }) => (
              <Chip key={id} active={stage === id} onClick={() => onStageChange(id)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {providers.length === 0 ? (
        <p className="text-sm text-text-muted bg-white rounded-xl p-4 text-center" role="status">
          مفيش حد مطابق دلوقتي، جرّب فلتر تاني.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} onBook={onBook} />
          ))}
        </div>
      )}
    </section>
  );
}
