// ─── Imports
import { DEVELOPER_LINKS, type DeveloperLinkId } from '@/config/developer';
import { WHATSAPP_ICON_PATH } from '@/components/ui/WhatsAppIcon';

// ─── Brand icons (Simple Icons, 24×24)

const ICON_PATHS: Record<DeveloperLinkId, string> = {
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  facebook:
    'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  whatsapp: WHATSAPP_ICON_PATH,
};

/** Brand colour per network, used on light backgrounds */
const BRAND_COLOR: Record<DeveloperLinkId, string> = {
  linkedin: 'text-[#0A66C2]',
  github: 'text-[#181717]',
  facebook: 'text-[#0866FF]',
  whatsapp: 'text-[#25D366]',
};

// ─── Component

interface DeveloperLinksProps {
  /** `onDark` for the green footer, `onLight` for white cards */
  tone?: 'onDark' | 'onLight';
  className?: string;
}

/** LinkedIn, GitHub, Facebook and WhatsApp icons for the app's developer. Each opens in a new tab. */
export function DeveloperLinks({ tone = 'onLight', className = '' }: DeveloperLinksProps) {
  const onDark = tone === 'onDark';

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="تواصل مع المطوّر">
      {DEVELOPER_LINKS.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.label} (بيفتح في صفحة جديدة)`}
            title={link.label}
            className={
              onDark
                ? 'flex items-center justify-center w-9 h-9 rounded-full bg-white/15 text-white transition-colors hover:bg-white hover:text-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light'
                : `flex items-center justify-center w-11 h-11 rounded-full bg-cream ${BRAND_COLOR[link.id]} transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green`
            }
          >
            <svg
              viewBox="0 0 24 24"
              className={onDark ? 'w-[18px] h-[18px]' : 'w-5 h-5'}
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d={ICON_PATHS[link.id]} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
