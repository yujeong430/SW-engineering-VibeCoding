import type { InputHTMLAttributes, CSSProperties } from 'react'
import { colors, typography, fontWeight, radius, spacing } from '../styles/tokens'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
}

export default function TextField({ label, helper, style, ...rest }: TextFieldProps) {
  return (
    <div style={wrap}>
      {label && <label style={labelStyle}>{label}</label>}
      <input style={{ ...inputStyle, ...style }} {...rest} />
      {helper && <span style={helperStyle}>{helper}</span>}
    </div>
  )
}

const wrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
}

const labelStyle: CSSProperties = {
  fontSize: typography.xl,
  fontWeight: fontWeight.bold,
  color: colors.textPrimary,
}

const inputStyle: CSSProperties = {
  padding: `${spacing.lg} ${spacing.lg}`,
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.bgCard,
  fontSize: typography.lg,
  color: colors.textPrimary,
}

const helperStyle: CSSProperties = {
  fontSize: typography.md,
  color: colors.textTertiary,
}
