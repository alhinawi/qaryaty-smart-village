// ─── Design Tokens & Theme Constants

export const THEME = {
  colors: {
    green: '#1a7a4a',
    greenLight: '#25a865',
    greenDark: '#0f4f2e',
    gold: '#f0a500',
    goldLight: '#ffc72c',
    cream: '#faf6ee',
    brown: '#6b3a1f',
    text: '#1a1a1a',
    textMuted: '#6b7280',
    white: '#ffffff',
    danger: '#ef4444',
  },
  shadows: {
    card: '0 4px 24px rgba(26, 122, 74, 0.12)',
    hover: '0 12px 40px rgba(26, 122, 74, 0.2)',
  },
  radius: {
    sm: '8px',
    md: '14px',
    lg: '18px',
    xl: '28px',
  },
} as const;
