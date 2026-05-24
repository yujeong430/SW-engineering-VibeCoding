export const colors = {
  primary: '#0066cc',
  primaryDark: '#0052a3',

  bgBlack: '#000000',
  bgDark: '#1c1c1e',
  bgLight: '#f2f2f7',
  bgCard: '#ffffff',
  bgSummary: '#1c1c1e',

  textPrimary: '#1c1c1e',
  textSecondary: '#6c6c70',
  textTertiary: '#aeaeb2',
  textOnDark: '#ffffff',
  textOnDarkSecondary: 'rgba(255, 255, 255, 0.6)',

  positive: '#0066cc',
  negative: '#ff3b30',

  border: '#e5e5ea',
  divider: '#f2f2f7',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const

export const avatarColors = [
  { bg: '#c8e6c9', text: '#2e7d32' },
  { bg: '#bbdefb', text: '#1565c0' },
  { bg: '#f8bbd0', text: '#880e4f' },
  { bg: '#fff9c4', text: '#f57f17' },
  { bg: '#e1bee7', text: '#6a1b9a' },
  { bg: '#ffe0b2', text: '#e65100' },
  { bg: '#b2dfdb', text: '#00695c' },
  { bg: '#ffccbc', text: '#bf360c' },
] as const

export const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

export const typography = {
  xs: '11px',
  sm: '13px',
  md: '15px',
  lg: '17px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
} as const

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
} as const

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const

export const shadow = {
  card: '0 1px 3px rgba(0, 0, 0, 0.08)',
  sheet: '0 -4px 20px rgba(0, 0, 0, 0.12)',
} as const

export const transition = {
  fast: '150ms ease',
  normal: '250ms ease',
} as const
