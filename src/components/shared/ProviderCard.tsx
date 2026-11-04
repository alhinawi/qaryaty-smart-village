// ─── Card for a teacher / nurse / doctor / babysitter / cleaner
import type { Provider } from '@/types';
import { Avatar } from './Avatar';
import { MODE_LABELS, PROVIDER_KIND_LABELS, STAGE_LABELS, SUBJECT_LABELS } from '@/data/teachers';

interface ProviderCardProps {
  provider: Provider;
  onBook: (provider: Provider) => void;
}

export function providerRoleLabel(provider: Provider): string {
  const role = PROVIDER_KIND_LABELS[provider.kind][provider.gender];
  if (provider.subject) return `${role} ${SUBJECT_LABELS[provider.subject]}`;
  if (provider.specialty) return `${role} ${provider.specialty}`;
  return role;
}

export function ProviderCard({ provider, onBook }: ProviderCardProps) {
  const role = providerRoleLabel(provider);
  return (
    <article
      className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3 border border-transparent hover:border-green/30 transition-colors"
      aria-label={`${provider.name}، ${role}`}
    >
      <div className="flex gap-3 items-start">
        <Avatar src={provider.photo} name={provider.name} size={60} />
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-[15px] leading-snug truncate">{provider.name}</h4>
          <p className="text-xs text-green font-bold">{role}</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            ⭐ {provider.rating.toFixed(1)} ({provider.reviews} تقييم) · {provider.experienceYears} سنين خبرة
          </p>
        </div>
      </div>

      <p className="text-[13px] text-text leading-relaxed">{provider.bio}</p>

      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
        {provider.stages?.map((stage) => (
          <span key={stage} className="bg-[#eff6ff] text-[#1d4ed8] px-2 py-0.5 rounded-full">
            {STAGE_LABELS[stage]}
          </span>
        ))}
        {provider.modes.map((mode) => (
          <span key={mode} className="bg-[#e8f5ee] text-green-dark px-2 py-0.5 rounded-full">
            {mode === 'online' ? '💻' : mode === 'clinic' ? '🏥' : '🏠'} {MODE_LABELS[mode]}
          </span>
        ))}
        <span className="bg-gray-100 text-text-muted px-2 py-0.5 rounded-full">📍 {provider.area}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="font-black text-green-dark text-sm">{provider.price}</span>
        <button
          type="button"
          onClick={() => onBook(provider)}
          className="bg-green text-white rounded-xl px-4 py-2 text-xs font-extrabold hover:bg-green-dark transition-colors"
          aria-label={`احجز مع ${provider.name}`}
        >
          احجز
        </button>
      </div>
    </article>
  );
}
