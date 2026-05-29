import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import api from '../lib/axios'
import AppHeader from '../components/AppHeader'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Select from '../components/Select'
import { BANKS } from '../constants/banks'
import type { CommonResponse } from '../types/common'
import type { Member } from '../types/member'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

interface AccountState {
  from?: 'expense' | 'group' | 'settlement'
  expenseTitle?: string
}

export default function AccountRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { uuid = '', memberId = '' } = useParams()
  const state = (location.state as AccountState | null) ?? {}
  const from = state.from ?? 'group'

  const [name, setName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<CommonResponse<Member>>(`/groups/${uuid}/members/${memberId}`)
      .then((res) => {
        const m = res.data.data
        if (m) {
          setName(m.name)
          setBankName(m.bankName ?? '')
          setAccountNo(m.accountNo ?? '')
          setIsEdit(Boolean(m.bankName || m.accountNo))
        }
      })
      .catch(() => setLoadError('멤버 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [uuid, memberId])

  const goBack = () => {
    if (from === 'expense') {
      navigate(`/groups/${uuid}`)
    } else {
      navigate(-1)
    }
  }

  const isValid = bankName.trim().length >= 1 && accountNo.trim().length >= 1

  const handleSave = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/groups/${uuid}/members/${memberId}`, {
        bankName: bankName.trim(),
        accountNo: accountNo.trim(),
      })
      goBack()
    } catch (e: unknown) {
      const err = e as { response?: { data?: CommonResponse<null> } }
      setError(err.response?.data?.message ?? '계좌 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={styles.center}>불러오는 중…</div>
  }
  if (loadError) {
    return <div style={styles.center}>{loadError}</div>
  }

  return (
    <div style={styles.container}>
      <AppHeader
        title={isEdit ? '계좌 수정' : '계좌 등록'}
        onBack={from === 'expense' ? undefined : () => navigate(-1)}
        right={
          from === 'expense' ? (
            <button style={styles.skipText} onClick={() => navigate(`/groups/${uuid}`)}>
              건너뛰기
            </button>
          ) : undefined
        }
      />

      <div style={styles.body}>
        <div style={styles.heading}>
          <Landmark size={26} strokeWidth={2} color={colors.primary} />
          <h1 style={styles.title}>{isEdit ? '계좌를 수정할까요?' : '계좌를 등록할까요?'}</h1>
        </div>
        <p style={styles.desc}>
          {from === 'expense' && state.expenseTitle
            ? `‘${state.expenseTitle}’ 지출이 저장됐어요.\n`
            : ''}
          계좌를 등록해 두면 정산 결과에서 멤버들이 바로 송금할 수 있어요.
          {from === 'expense' ? ' (선택)' : ''}
        </p>

        <div style={styles.memberRow}>
          <Avatar name={name} colorIndex={0} size={36} />
          <span style={styles.memberName}>{name} 님의 계좌</span>
        </div>

        <section style={styles.field}>
          <label style={styles.label}>은행</label>
          <Select
            value={bankName}
            onChange={setBankName}
            options={BANKS}
            placeholder="은행 선택"
          />
        </section>

        <section style={styles.field}>
          <label style={styles.label}>계좌번호</label>
          <input
            style={styles.input}
            type="text"
            inputMode="numeric"
            placeholder="ex. 3333-12-3456789"
            maxLength={40}
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
          />
          <span style={styles.helper}>정산에서 ‘받는 사람’일 때만 멤버에게 보여요</span>
        </section>

        {error && <p style={styles.errorText}>{error}</p>}
      </div>

      <div style={styles.footer}>
        <Button disabled={!isValid || submitting} onClick={handleSave}>
          {submitting ? '저장 중…' : '계좌 저장'}
        </Button>
        {from === 'expense' && (
          <Button variant="text" onClick={() => navigate(`/groups/${uuid}`)}>
            다음에 할게요
          </Button>
        )}
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
  center: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    fontSize: typography.md,
  },
  skipText: {
    background: 'none',
    border: 'none',
    color: colors.primary,
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
  },
  body: {
    flex: 1,
    padding: `${spacing.lg} ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  desc: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre-line',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  input: {
    padding: `${spacing.lg} ${spacing.lg}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
    fontSize: typography.lg,
    color: colors.textPrimary,
  },
  helper: {
    fontSize: typography.sm,
    color: colors.textTertiary,
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.negative,
    textAlign: 'center',
    margin: 0,
  },
  footer: {
    padding: `${spacing.lg} ${spacing.xl}`,
    paddingBottom: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
}
