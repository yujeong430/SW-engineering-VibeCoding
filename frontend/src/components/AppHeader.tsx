import type { ReactNode, CSSProperties } from 'react'
import { ChevronLeft } from 'lucide-react'
import { colors, typography, fontWeight, radius, spacing } from '../styles/tokens'

interface AppHeaderProps {
  title?: string
  onBack?: () => void
  right?: ReactNode
}

export default function AppHeader({ title, onBack, right }: AppHeaderProps) {
  return (
    <header style={header}>
      <div style={side}>
        {onBack && (
          <button style={backBtn} onClick={onBack} aria-label="뒤로 가기">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        )}
      </div>
      {title && <span style={titleStyle}>{title}</span>}
      <div style={{ ...side, justifyContent: 'flex-end' }}>{right}</div>
    </header>
  )
}

const header: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg} ${spacing.xl}`,
}

const side: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 44,
}

const backBtn: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: radius.full,
  backgroundColor: colors.bgCard,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.textPrimary,
  cursor: 'pointer',
}

const titleStyle: CSSProperties = {
  fontSize: typography.xl,
  fontWeight: fontWeight.bold,
  color: colors.textPrimary,
}
