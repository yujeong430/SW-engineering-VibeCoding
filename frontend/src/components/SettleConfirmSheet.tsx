import { useState } from 'react'
import { AlertCircle, Lock } from 'lucide-react'
import api from '../lib/axios'
import Button from './Button'
import { formatWon } from '../lib/format'
import type { CommonResponse } from '../types/common'
import type { SettlementResult } from '../types/settlement'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

interface Props {
  uuid: string
  expenseCount: number
  totalAmount: number
  onClose: () => void
  onSuccess: () => void
}

export default function SettleConfirmSheet({
  uuid,
  expenseCount,
  totalAmount,
  onClose,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSettle = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await api.post<CommonResponse<SettlementResult>>(`/groups/${uuid}/settle`)
      onSuccess()
    } catch (e: unknown) {
      const err = e as { response?: { data?: CommonResponse<null> } }
      setError(err.response?.data?.message ?? '정산에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.handle} />

        <div style={styles.iconWrap}>
          <Lock size={28} strokeWidth={2.5} color={colors.textOnDark} />
        </div>

        <h2 style={styles.title}>정산을 확정할까요?</h2>
        <p style={styles.subtitle}>지금까지의 지출로 최소 송금 결과를 계산해요.</p>

        <div style={styles.infoCard}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>지출</span>
            <span style={styles.infoValue}>{expenseCount}건</span>
          </div>
          <div style={styles.infoDivider} />
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>총액</span>
            <span style={styles.infoValue}>{formatWon(totalAmount)}</span>
          </div>
        </div>

        <div style={styles.warning}>
          <AlertCircle
            size={16}
            strokeWidth={2}
            color={colors.negative}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <span style={styles.warningText}>
            확정한 뒤에는 지출·멤버를 바꿀 수 없어요. 되돌릴 수 없는 작업이에요.
          </span>
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        <div style={styles.actions}>
          <Button disabled={submitting} onClick={handleSettle}>
            {submitting ? '처리 중…' : '정산 확정하기'}
          </Button>
          <button style={styles.cancelBtn} onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: colors.overlay,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 100,
  },
  sheet: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: `${spacing.md} ${spacing.xl} 32px`,
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.12)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    margin: '0 auto 20px',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.bgDark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    margin: `0 0 ${spacing.sm}`,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    margin: `0 0 ${spacing.xl}`,
    lineHeight: 1.5,
  },
  infoCard: {
    backgroundColor: colors.bgLight,
    borderRadius: radius.md,
    padding: `${spacing.lg} ${spacing.xl}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  infoDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
    marginBottom: spacing.xl,
  },
  warningText: {
    fontSize: typography.sm,
    color: colors.negative,
    lineHeight: 1.5,
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.negative,
    textAlign: 'center',
    margin: `0 0 ${spacing.md}`,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  cancelBtn: {
    width: '100%',
    padding: spacing.md,
    background: 'none',
    border: 'none',
    color: colors.textSecondary,
    fontSize: typography.lg,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    textAlign: 'center',
  },
}
