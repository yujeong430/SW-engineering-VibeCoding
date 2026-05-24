import type { CSSProperties } from 'react'
import { colors, typography, fontWeight, radius, spacing } from '../styles/tokens'
import { getAvatarColor } from '../styles/tokens'

interface AvatarProps {
  name: string
  colorIndex: number
  size?: number
  showName?: boolean
}

export default function Avatar({ name, colorIndex, size = 48, showName = false }: AvatarProps) {
  const { bg, text } = getAvatarColor(colorIndex)

  return (
    <div style={wrap}>
      <div
        style={{
          ...circle,
          width: size,
          height: size,
          backgroundColor: bg,
          color: text,
          fontSize: size * 0.42,
        }}
      >
        {name.charAt(0)}
      </div>
      {showName && <span style={nameStyle}>{name}</span>}
    </div>
  )
}

const wrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing.xs,
}

const circle: CSSProperties = {
  borderRadius: radius.full,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: fontWeight.bold,
  flexShrink: 0,
}

const nameStyle: CSSProperties = {
  fontSize: typography.sm,
  color: colors.textSecondary,
  fontWeight: fontWeight.medium,
}
