// ─── One tile per people section (المدرسين، الدكاترة والتمريض…) on the home page
import type { ServiceCategory } from '@/types';
import { PEOPLE_SECTIONS } from '@/utils/peopleSections';

interface PeopleSectionsRowProps {
  counts: Record<ServiceCategory, number>;
  onOpen: (category: ServiceCategory) => void;
}

export function PeopleSectionsRow({ counts, onOpen }: PeopleSectionsRowProps) {
  const sections = PEOPLE_SECTIONS.filter((section) => counts[section.id] > 0);
  if (sections.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="people-sections-title">
      <h3 id="people-sections-title" className="text-lg font-extrabold text-text m-0 mb-3">
        <span aria-hidden="true">👥</span> احجز حد بالاسم
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onOpen(section.id)}
            aria-label={`افتح قسم ${section.title}، ${counts[section.id]} متاح`}
            className="bg-white rounded-2xl p-3.5 shadow-sm border-2 border-transparent hover:border-green text-start cursor-pointer font-['Cairo',sans-serif] flex items-center gap-3 transition-colors"
          >
            <span className="text-[28px] leading-none shrink-0" aria-hidden="true">
              {section.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-extrabold text-[14px] text-text leading-snug">{section.title}</span>
              <span className="block text-[12px] text-green font-bold">{counts[section.id]} متاح</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
