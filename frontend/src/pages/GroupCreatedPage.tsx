import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Check, Lock, Copy } from 'lucide-react'
import Button from '../components/Button'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

interface CreatedState {
  uuid: string
  name: string
}

export default function GroupCreatedPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as CreatedState | null
  const [copied, setCopied] = useState(false)

  if (!state?.uuid) {
    return <Navigate to="/" replace />
  }

  const { uuid, name } = state
  const inviteLink = `${window.location.host}/groups/${uuid}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/groups/${uuid}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        <div style={styles.checkCircle}>
          <Check size={32} strokeWidth={3} color={colors.primary} />
        </div>

        <h1 style={styles.title}>
          ‘{name}’<br />
          그룹이 만들어졌어요
        </h1>
        <p style={styles.subtitle}>
          아래 링크를 멤버들에게 공유하면<br />
          바로 함께 정산할 수 있어요.
        </p>

        <div style={styles.linkCard}>
          <div style={styles.linkInfo}>
            <span style={styles.cardLabel}>초대 링크</span>
            <span style={styles.linkText}>{inviteLink}</span>
          </div>
          <button style={styles.copyBtn} onClick={handleCopy}>
            <Copy size={14} strokeWidth={2.5} />
            {copied ? '복사됨' : '복사'}
          </button>
        </div>

        <div style={styles.pinCard}>
          <Lock size={20} strokeWidth={2.2} color={colors.textSecondary} style={styles.lockIcon} />
          <div style={styles.pinInfo}>
            <span style={styles.pinTitle}>방장 PIN을 기억해 두세요</span>
            <span style={styles.pinDesc}>멤버에게는 공유하지 마세요 · 정산 확정용</span>
          </div>
          <div style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={styles.pinDot} />
            ))}
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <Button onClick={() => navigate(`/groups/${uuid}`)}>그룹으로 이동</Button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    backgroundColor: colors.bgLight,
  },
  body: {
    flex: 1,
    padding: `${spacing['3xl']} ${spacing.xl} 0`,
    display: 'flex',
    flexDirection: 'column',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 102, 204, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 1.4,
    margin: 0,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: `${spacing.md} 0 ${spacing['2xl']}`,
  },
  linkCard: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.lg} ${spacing.lg}`,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  linkInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: typography.xs,
    color: colors.textTertiary,
  },
  linkText: {
    fontSize: typography.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyBtn: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    color: colors.textOnDark,
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
  },
  pinCard: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.lg} ${spacing.lg}`,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
  },
  lockIcon: {
    flexShrink: 0,
  },
  pinInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  pinTitle: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  pinDesc: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  pinDots: {
    display: 'flex',
    gap: spacing.sm,
    flexShrink: 0,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
  },
  footer: {
    padding: `${spacing.lg} ${spacing.xl}`,
    paddingBottom: 32,
  },
}
