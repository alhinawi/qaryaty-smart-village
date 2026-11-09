import { Link } from 'react-router';
import { CatalogShareButton } from './CatalogShareButton';
// ─── Card for one person you book directly: teacher, nurse, plumber, painter, gas delivery…
import type { Provider, ProviderMode, TeacherGroup } from '@/types';
import { Avatar } from './Avatar';
import { MODE_LABELS, STAGE_LABELS } from '@/data/teachers';
import { providerRoleLabel } from '@/utils/people';
import { counted } from '@/utils/plural';
import { groupDays, seatsText } from '@/utils/teacherGroups';

interface ProviderCardProps {
  provider: Provider;
  /** `group`: the customer picked one of a teacher's group classes. */
  onBook: (provider: Provider, group?: TeacherGroup) => void;
  /** The online tab: lead with "أونلاين" and say where they are from. */
  online?: boolean;
  showShare?: boolean;
  headingLevel?: 'h2' | 'h3';
}

const MODE_ICONS: Record<ProviderMode, string> = {
  online: '💻',
  clinic: '🏥',
  home: '🏠',
  teacher_home: '🏡',
  center: '🏫',
};

export function ProviderCard({ provider, onBook, online = false, showShare = true, headingLevel: Heading = 'h3' }: ProviderCardProps) {
  const role = providerRoleLabel(provider);
  // In the online tab only the online mode matters; in the village tab, how they come to you
  const modes = online ? (['online'] as ProviderMode[]) : provider.modes;
  const groups = provider.groups ?? [];
  const cheapestGroup = groups.length ? Math.min(...groups.map((g) => g.monthlyPrice)) : null;
  const prices = [provider.price, ...(cheapestGroup != null ? [`مجموعة: من ${cheapestGroup} ج/الشهر`] : [])];

  return (
    <article
      className="motion-card bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3 border border-transparent hover:border-green/30 transition-colors"
      aria-label={`${provider.name}، ${role}`}
    >
      <div className="flex gap-3 items-start">
        <Avatar src={provider.photo} name={provider.name} size={60} />
        <div className="min-w-0 flex-1">
          <Heading className="font-extrabold text-[15px] leading-snug truncate">{provider.name}</Heading>
          <p className="text-xs text-green font-bold">{role}</p>
          {/* A new provider with no reviews or no stated experience shows neither, never a made-up 0 */}
          {(provider.reviews > 0 || provider.experienceYears > 0) && (
            <p className="text-[11px] text-text-muted mt-0.5">
              {[
                provider.reviews > 0 ? `⭐ ${provider.rating.toFixed(1)} (${provider.reviews} ${counted(provider.reviews, 'تقييم', 'تقييمين', 'تقييمات')})` : null,
                provider.experienceYears > 0 ? `${provider.experienceYears} ${counted(provider.experienceYears, 'سنة', 'سنتين', 'سنين')} خبرة` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        {showShare && <CatalogShareButton compact kind="provider" id={provider.id} name={provider.name} />}
        {online && (
          <span className="shrink-0 bg-[#eef2ff] text-[#4338ca] text-[11px] font-extrabold px-2 py-1 rounded-full">
            💻 أونلاين
          </span>
        )}
      </div>

      <p className="text-[13px] text-text leading-relaxed">{provider.bio}</p>

      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
        {provider.stages?.map((stage) => (
          <span key={stage} className="bg-[#eff6ff] text-[#1d4ed8] px-2 py-0.5 rounded-full">
            {STAGE_LABELS[stage]}
          </span>
        ))}
        {modes.map((mode) => (
          <span key={mode} className="bg-[#e8f5ee] text-green-dark px-2 py-0.5 rounded-full">
            {MODE_ICONS[mode]} {MODE_LABELS[mode]}
          </span>
        ))}
        {provider.inspectionFee !== undefined && (
          <span className="bg-[#fff7ed] text-[#c2410c] px-2 py-0.5 rounded-full">
            🔎 {provider.inspectionFee === 0 ? 'معاينة مجانية' : `معاينة ${provider.inspectionFee} ج`}
          </span>
        )}
        {provider.village && (
          <span className="bg-gray-100 text-text-muted px-2 py-0.5 rounded-full">
            📍 {online ? `من ${provider.village}` : [provider.village, provider.area].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {groups.length > 0 && (
        <details className="rounded-xl bg-[#f6faf7] border border-green/15 text-[12px]">
          <summary className="cursor-pointer select-none px-3 py-2 font-extrabold text-green-dark">
            🗓️ مواعيد المجموعات ({groups.length})
          </summary>
          <ul className="flex flex-col gap-2 px-3 pb-3">
            {groups.map((group) => {
              const full = group.seatsLeft <= 0;
              return (
                <li key={group.id} className="bg-white rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-extrabold text-text">
                      {STAGE_LABELS[group.stage]} · {MODE_ICONS[group.mode]} {MODE_LABELS[group.mode]}
                    </p>
                    <p className="text-text-muted">
                      {groupDays(group)} · {group.time} · {group.minutes} دقيقة
                    </p>
                    <p className="font-bold text-green-dark">
                      {group.monthlyPrice} ج/الشهر ·{' '}
                      <span className={full ? 'text-red-600' : group.seatsLeft <= 3 ? 'text-[#c2410c]' : ''}>
                        {seatsText(group.seatsLeft)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => onBook(provider, group)}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-extrabold bg-green text-white hover:bg-green-dark disabled:bg-gray-200 disabled:text-text-muted transition-colors"
                    aria-label={`احجز مكان في مجموعة ${STAGE_LABELS[group.stage]} ${groupDays(group)} ${group.time} مع ${provider.name}`}
                  >
                    {full ? 'كاملة' : 'احجز مكان'}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <Link to={`/providers/${provider.id}`} onClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()} className="inline-block text-[11px] text-green font-bold py-2">التفاصيل والآراء</Link>
      <div className="flex items-end justify-between gap-2 mt-auto">
        <div className="flex flex-col gap-0.5 min-w-0">
          {prices.map((line) => (
            <span key={line} className="font-black text-green-dark text-sm">
              {line}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onBook(provider)}
          className="bg-green text-white rounded-xl px-4 py-2 text-xs font-extrabold hover:bg-green-dark transition-colors shrink-0"
          aria-label={`احجز مع ${provider.name}`}
        >
          احجز
        </button>
      </div>
    </article>
  );
}
