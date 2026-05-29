import type { CSSProperties } from 'react'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

interface ConfirmModalProps {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()} role="alertdialog">
        <h3 style={styles.title}>{title}</h3>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            style={{
              ...styles.confirmBtn,
              backgroundColor: destructive ? colors.negative : colors.primary,
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: colors.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 200,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: `${spacing['2xl']} ${spacing.xl} ${spacing.lg}`,
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.18)',
  },
  title: {
    fontSize: typography.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    margin: 0,
  },
  message: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 1.5,
    margin: `${spacing.md} 0 0`,
  },
  actions: {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
  },
  cancelBtn: {
    flex: 1,
    padding: `${spacing.md} 0`,
    borderRadius: radius.md,
    backgroundColor: colors.bgLight,
    color: colors.textSecondary,
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1,
    padding: `${spacing.md} 0`,
    borderRadius: radius.md,
    color: colors.textOnDark,
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
  },
}
