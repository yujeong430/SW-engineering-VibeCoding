import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import { colors, typography, fontWeight, radius, spacing } from '../styles/tokens'

type Variant = 'primary' | 'outline' | 'text'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = true,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        ...base,
        ...variants[variant],
        ...(fullWidth ? { width: '100%' } : {}),
        ...(disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

const base: CSSProperties = {
  padding: `${spacing.lg} ${spacing.lg}`,
  borderRadius: radius.md,
  fontSize: typography.lg,
  fontWeight: fontWeight.semibold,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
}

const variants: Record<Variant, CSSProperties> = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.textOnDark,
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
  },
  text: {
    backgroundColor: 'transparent',
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    padding: spacing.md,
  },
}
