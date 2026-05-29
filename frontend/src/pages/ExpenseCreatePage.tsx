import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import api from '../lib/axios'
import { formatWon } from '../lib/format'
import AppHeader from '../components/AppHeader'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import type { CommonResponse } from '../types/common'
import type { GroupDetail } from '../types/group'
import type { MemberSummary } from '../types/member'
import type { ExpenseDetail } from '../types/expense'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

export default function ExpenseCreatePage() {
  const navigate = useNavigate()
  const { uuid = '' } = useParams()

  const [members, setMembers] = useState<MemberSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [payerId, setPayerId] = useState<number | null>(null)
  const [shareIds, setShareIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<CommonResponse<GroupDetail>>(`/groups/${uuid}`)
      .then((res) => {
        const data = res.data.data
        if (data) {
          setMembers(data.members)
          setShareIds(data.members.map((m) => m.id)) // 기본값: 전체 멤버 (FR-14)
        }
      })
      .catch(() => setLoadError('그룹 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [uuid])

  const amountValue = Number(amount) || 0
  const allSelected = members.length > 0 && shareIds.length === members.length

  const isValid =
    title.trim().length >= 1 &&
    amountValue >= 10 &&
    amountValue % 10 === 0 &&
    payerId !== null &&
    shareIds.length >= 1

  const perShare = useMemo(() => {
    const n = shareIds.length
    if (n === 0 || amountValue < 10) return { base: 0, remainder: 0 }
    const base = Math.floor(amountValue / n / 10) * 10
    return { base, remainder: amountValue - base * n }
  }, [amountValue, shareIds.length])

  const toggleShare = (id: number) => {
    setShareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleAll = () => {
    setShareIds(allSelected ? [] : members.map((m) => m.id))
  }

  const colorIndexOf = (id: number) => members.findIndex((m) => m.id === id)

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await api.post<CommonResponse<ExpenseDetail>>(`/groups/${uuid}/expenses`, {
        title: title.trim(),
        amount: amountValue,
        payerId,
        shareMemberIds: shareIds,
      })
      // 결제자 계좌 등록 안내 (FR-07)
      navigate(`/groups/${uuid}/members/${payerId}/account`, {
        state: { from: 'expense', expenseTitle: title.trim() },
      })
    } catch (e: unknown) {
      const err = e as { response?: { data?: CommonResponse<null> } }
      setError(err.response?.data?.message ?? '지출 등록에 실패했습니다.')
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
      <AppHeader title="지출 추가" onBack={() => navigate(-1)} />

      <div style={styles.body}>
        <section style={styles.section}>
          <label style={styles.label}>금액</label>
          <div style={styles.amountRow}>
            <span style={styles.won}>₩</span>
            <input
              style={styles.amountInput}
              type="tel"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d]/g, ''))
                setError('')
              }}
            />
          </div>
          <span style={styles.helper}>10원 이상 · 10원 단위</span>
        </section>

        <section style={styles.section}>
          <label style={styles.label}>항목</label>
          <input
            style={styles.input}
            type="text"
            placeholder="ex. 흑돼지 저녁"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </section>

        <section style={styles.section}>
          <label style={styles.label}>낸 사람</label>
          <div style={styles.payerRow}>
            {members.map((m, i) => {
              const selected = payerId === m.id
              return (
                <button
                  key={m.id}
                  style={styles.payerItem}
                  onClick={() => setPayerId(m.id)}
                >
                  <div style={selected ? styles.payerSelectedRing : undefined}>
                    <Avatar name={m.name} colorIndex={i} size={48} />
                  </div>
                  <span
                    style={{
                      ...styles.payerName,
                      color: selected ? colors.primary : colors.textSecondary,
                      fontWeight: selected ? fontWeight.bold : fontWeight.medium,
                    }}
                  >
                    {m.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.shareHeader}>
            <label style={styles.label}>분담 대상 · {shareIds.length}명</label>
            <button style={styles.selectAllBtn} onClick={toggleAll}>
              <Check size={14} strokeWidth={3} />
              전체 선택
            </button>
          </div>
          <div style={styles.chipWrap}>
            {members.map((m, i) => {
              const selected = shareIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  style={{
                    ...styles.chip,
                    backgroundColor: selected ? colors.primary : colors.bgCard,
                    border: selected ? 'none' : `1px solid ${colors.border}`,
                  }}
                  onClick={() => toggleShare(m.id)}
                >
                  <Avatar name={m.name} colorIndex={i} size={24} />
                  <span
                    style={{
                      ...styles.chipName,
                      color: selected ? colors.textOnDark : colors.textPrimary,
                    }}
                  >
                    {m.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {shareIds.length > 0 && amountValue >= 10 && (
          <section style={styles.previewCard}>
            <span style={styles.previewTitle}>1/N 균등 · 1인당 분담</span>
            <ul style={styles.previewList}>
              {members
                .filter((m) => shareIds.includes(m.id))
                .map((m) => (
                  <li key={m.id} style={styles.previewItem}>
                    <Avatar name={m.name} colorIndex={colorIndexOf(m.id)} size={32} />
                    <span style={styles.previewName}>
                      {m.name}
                      {payerId === m.id && ' · 결제자'}
                    </span>
                    <span style={styles.previewAmount}>{formatWon(perShare.base)}</span>
                  </li>
                ))}
            </ul>
            {perShare.remainder > 0 && (
              <span style={styles.previewNote}>
                10원 단위 나머지 {formatWon(perShare.remainder)}는 분담 인원 중 1명에게 배정돼요
              </span>
            )}
          </section>
        )}

        {error && <p style={styles.errorText}>{error}</p>}
      </div>

      <div style={styles.footer}>
        <Button disabled={!isValid || submitting} onClick={handleSubmit}>
          {submitting ? '저장 중…' : '저장'}
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
  center: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    fontSize: typography.md,
  },
  body: {
    flex: 1,
    padding: `${spacing.lg} ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xl'],
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  label: {
    fontSize: typography.md,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  amountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.lg} ${spacing.lg}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
  },
  won: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textTertiary,
  },
  amountInput: {
    flex: 1,
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    border: 'none',
    backgroundColor: 'transparent',
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
  payerRow: {
    display: 'flex',
    gap: spacing.lg,
    overflowX: 'auto',
  },
  payerItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  payerSelectedRing: {
    borderRadius: radius.full,
    border: `2px solid ${colors.primary}`,
    padding: 2,
  },
  payerName: {
    fontSize: typography.sm,
  },
  shareHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    border: 'none',
  },
  chipWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs} ${spacing.md} ${spacing.xs} ${spacing.xs}`,
    borderRadius: radius.full,
    cursor: 'pointer',
  },
  chipName: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
  },
  previewCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: `${spacing.lg} ${spacing.lg}`,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
  },
  previewTitle: {
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  previewList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  previewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewName: {
    flex: 1,
    fontSize: typography.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  previewAmount: {
    fontSize: typography.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  previewNote: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    lineHeight: 1.5,
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
  },
}
