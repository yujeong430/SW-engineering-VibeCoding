import { useRef, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import api from '../lib/axios'
import AppHeader from '../components/AppHeader'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import type { CommonResponse } from '../types/common'
import type { GroupSummary } from '../types/group'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

interface SetupState {
  name: string
  pin: string
}

export default function MemberSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as SetupState | null
  const inputRef = useRef<HTMLInputElement>(null)

  const [members, setMembers] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!state?.name || !state?.pin) {
    return <Navigate to="/" replace />
  }

  const { name, pin } = state

  const handleAdd = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (members.includes(trimmed)) {
      setError('이미 추가된 멤버예요.')
      return
    }
    setMembers((prev) => [...prev, trimmed])
    setInput('')
    setError('')
    inputRef.current?.focus()
  }

  const handleRemove = (target: string) => {
    setMembers((prev) => prev.filter((m) => m !== target))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleComplete = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post<CommonResponse<GroupSummary>>('/groups', {
        name,
        pin,
        members,
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
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <AppHeader title="멤버 등록" onBack={() => navigate(-1)} />

      <div style={styles.body}>
        <p style={styles.desc}>
          함께 정산할 멤버를 추가해 주세요.<br />
          그룹 화면에서 언제든 추가·수정할 수 있어요.
        </p>

        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            style={styles.input}
            type="text"
            placeholder="멤버 이름 (예: 지수)"
            maxLength={20}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError('')
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            style={{ ...styles.addBtn, opacity: input.trim() ? 1 : 0.4 }}
            onClick={handleAdd}
            disabled={!input.trim()}
            aria-label="멤버 추가"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        <span style={styles.countLabel}>등록된 멤버 {members.length}명</span>

        {members.length === 0 ? (
          <div style={styles.empty}>아직 등록된 멤버가 없어요</div>
        ) : (
          <ul style={styles.memberList}>
            {members.map((m, i) => (
              <li
                key={m}
                style={{
                  ...styles.memberItem,
                  ...(i === members.length - 1 ? { borderBottom: 'none' } : {}),
                }}
              >
                <Avatar name={m} colorIndex={i} size={40} />
                <span style={styles.memberName}>{m}</span>
                <button
                  style={styles.removeBtn}
                  onClick={() => handleRemove(m)}
                  aria-label={`${m} 삭제`}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.footer}>
        <Button disabled={submitting} onClick={handleComplete}>
          {submitting
            ? '생성 중…'
            : members.length > 0
              ? `완료 (${members.length}명)`
              : '멤버 없이 시작하기'}
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
    padding: `${spacing.lg} ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
  },
  desc: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: `0 0 ${spacing.xl}`,
  },
  inputRow: {
    display: 'flex',
    gap: spacing.md,
  },
  input: {
    flex: 1,
    padding: `${spacing.lg} ${spacing.lg}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
    fontSize: typography.lg,
    color: colors.textPrimary,
  },
  addBtn: {
    flexShrink: 0,
    width: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    color: colors.textOnDark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 150ms ease',
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.negative,
    margin: `${spacing.md} 0 0`,
  },
  countLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    margin: `${spacing['2xl']} 0 ${spacing.md}`,
  },
  empty: {
    padding: `${spacing['3xl']} 0`,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: typography.md,
  },
  memberList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.divider}`,
  },
  memberName: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  removeBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textTertiary,
    cursor: 'pointer',
    flexShrink: 0,
  },
  footer: {
    padding: `${spacing.lg} ${spacing.xl}`,
    paddingBottom: 32,
  },
}
