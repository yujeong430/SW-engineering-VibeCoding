import { useState } from 'react'
import { Delete } from 'lucide-react'
import api from '../lib/axios'
import type { CommonResponse } from '../types/common'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

interface PinAuthSheetProps {
  uuid: string
  onClose: () => void
  onSuccess: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back']

export default function PinAuthSheet({ uuid, onClose, onSuccess }: PinAuthSheetProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (value: string) => {
    setSubmitting(true)
    setError('')
    try {
      await api.post<CommonResponse<{ isHost: boolean }>>(`/groups/${uuid}/auth`, {
        pin: value,
      })
      onSuccess()
    } catch (e: unknown) {
      const err = e as { response?: { data?: CommonResponse<null> } }
      setError(err.response?.data?.message ?? 'PIN이 일치하지 않습니다.')
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKey = (key: string) => {
    if (submitting) return
    if (key === 'back') {
      setPin((prev) => prev.slice(0, -1))
      setError('')
      return
    }
    if (!key || pin.length >= 4) return
    const next = pin + key
    setPin(next)
    setError('')
    if (next.length === 4) {
      submit(next)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.handle} />
        <h2 style={styles.title}>방장으로 전환</h2>
        <p style={styles.subtitle}>방장 PIN 4자리를 입력하세요</p>

        <div style={styles.dotRow}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                backgroundColor: i < pin.length ? colors.primary : colors.border,
              }}
            />
          ))}
        </div>

        <p style={styles.errorText}>{error}</p>

        <div style={styles.keypad}>
          {KEYS.map((key, i) => (
            <button
              key={i}
              style={{
                ...styles.key,
                visibility: key === '' ? 'hidden' : 'visible',
                backgroundColor: key === 'back' ? 'transparent' : colors.bgCard,
                boxShadow: key === 'back' ? 'none' : styles.key.boxShadow,
              }}
              onClick={() => handleKey(key)}
              disabled={key === ''}
            >
              {key === 'back' ? <Delete size={24} strokeWidth={2} /> : key}
            </button>
          ))}
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
    backgroundColor: colors.bgLight,
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
    margin: '0 auto',
  },
  title: {
    fontSize: typography.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    margin: `${spacing.xl} 0 ${spacing.sm}`,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    margin: 0,
  },
  dotRow: {
    display: 'flex',
    gap: spacing.lg,
    justifyContent: 'center',
    padding: `${spacing.xl} 0 ${spacing.sm}`,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.negative,
    textAlign: 'center',
    minHeight: 18,
    margin: `0 0 ${spacing.md}`,
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.md,
  },
  key: {
    height: 56,
    borderRadius: radius.md,
    fontSize: typography['2xl'],
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
  },
}
