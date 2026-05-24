import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import type { CommonResponse } from '../types/common'
import type { GroupSummary } from '../types/group'
import AppHeader from '../components/AppHeader'
import TextField from '../components/TextField'
import Button from '../components/Button'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

export default function CreateGroupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const pinValue = pin.join('')
  const isValid = name.trim().length >= 1 && pinValue.length === 4

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    setError('')
    const next = [...pin]
    next[index] = value
    setPin(next)
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  const handleSubmit = async () => {
    if (!isValid || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post<CommonResponse<GroupSummary>>('/groups', {
        name: name.trim(),
        pin: pinValue,
      })
      const data = res.data.data
      if (data) {
        navigate('/groups/new/done', {
          state: { uuid: data.uuid, name: data.name },
        })
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: CommonResponse<null> } }
      setError(err.response?.data?.message ?? '그룹 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <AppHeader title="새 그룹" onBack={() => navigate(-1)} />

      <div style={styles.body}>
        <TextField
          label="그룹 이름"
          placeholder="ex. 제주도 여행"
          helper="여행·모임 한 건이 하나의 그룹이 돼요 · 1~50자"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <section style={styles.section}>
          <label style={styles.label}>방장 PIN · 숫자 4자리</label>
          <span style={styles.helper}>정산 확정·멤버 관리 권한을 지킬 4자리예요</span>
          <div style={styles.pinRow}>
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={pinRefs[i]}
                style={styles.pinBox}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
              />
            ))}
          </div>
        </section>

        {error && <p style={styles.errorText}>{error}</p>}
      </div>

      <div style={styles.footer}>
        <Button disabled={!isValid || loading} onClick={handleSubmit}>
          {loading ? '생성 중…' : '그룹 만들기'}
        </Button>
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
    padding: `${spacing.xl} ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['3xl'],
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  label: {
    fontSize: typography.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  helper: {
    fontSize: typography.md,
    color: colors.textTertiary,
  },
  pinRow: {
    display: 'flex',
    gap: spacing.lg,
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  pinBox: {
    flex: 1,
    aspectRatio: '1 / 1',
    maxWidth: 84,
    borderRadius: radius.lg,
    border: `1.5px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
    fontSize: typography['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  errorText: {
    fontSize: typography.md,
    color: colors.negative,
    textAlign: 'center' as const,
    margin: 0,
  },
  footer: {
    padding: `${spacing.lg} ${spacing.xl}`,
    paddingBottom: 32,
  },
}
