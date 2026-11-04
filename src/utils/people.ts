// ─── Helpers for showing people (providers, users)
import type { Provider } from '@/types';
import { PROVIDER_KIND_LABELS, SUBJECT_LABELS } from '@/data/teachers';

/** First letters of the first two words, skipping titles like أ. / د. */
export function initialsOf(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((w) => w && !/^(أ|د|م)\.?$/.test(w) && !w.endsWith('.'));
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join(' ');
}

export function providerRoleLabel(provider: Provider): string {
  const role = PROVIDER_KIND_LABELS[provider.kind][provider.gender];
  if (provider.subject) return `${role} ${SUBJECT_LABELS[provider.subject]}`;
  if (provider.specialty) return `${role} ${provider.specialty}`;
  return role;
}
