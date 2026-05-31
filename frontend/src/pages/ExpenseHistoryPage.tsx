import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import api from '../lib/axios'
import { formatWon } from '../lib/format'
import AppHeader from '../components/AppHeader'
import Avatar from '../components/Avatar'
import type { CommonResponse } from '../types/common'
import type { GroupDetail } from '../types/group'
import type { ExpenseSummary } from '../types/expense'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

export default function ExpenseHistoryPage() {
  const navigate = useNavigate()
  const { uuid = '' } = useParams()

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<CommonResponse<GroupDetail>>(`/groups/${uuid}`)
      .then((res) => setGroup(res.data.data))
      .catch((e: unknown) => {
        const err = e as { response?: { data?: CommonResponse<null> } }
        setError(err.response?.data?.message ?? '지출 내역을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [uuid])

  // 멤버 id → { name, colorIndex } 맵
  const memberMap = useMemo(() => {
    const map = new Map<number, { name: string; colorIndex: number }>()
    group?.members.forEach((m, i) => map.set(m.id, { name: m.name, colorIndex: i }))
    return map
  }, [group])

  const total = useMemo(
    () => group?.expenses.reduce((s, e) => s + e.amount, 0) ?? 0,
    [group],
  )

  if (loading) return <div style={styles.center}>불러오는 중…</div>
  if (error || !group) {
    return <div style={styles.center}>{error || '그룹을 찾을 수 없습니다.'}</div>
  }

  return (
    <div style={styles.container}>
      <AppHeader title="지출 내역" onBack={() => navigate(`/groups/${uuid}/settlement`)} />

      <div style={styles.body}>
        {/* 상태 바 */}
        <div style={styles.statusBar}>
          <div style={styles.settledBadge}>
            <Lock size={12} strokeWidth={2.5} />
            <span>정산 완료</span>
          </div>
          <span style={styles.totalLabel}>총 {formatWon(total)}</span>
        </div>

        {/* 지출 카드 목록 */}
        {group.expenses.length === 0 ? (
          <div style={styles.empty}>지출 내역이 없어요.</div>
        ) : (
          <div style={styles.expenseList}>
            {group.expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                memberMap={memberMap}
              />
            ))}
          </div>
        )}

        <p style={styles.readonlyHint}>정산이 확정되어 수정할 수 없어요</p>
      </div>
    </div>
  )
}

interface ExpenseCardProps {
  expense: ExpenseSummary
  memberMap: Map<number, { name: string; colorIndex: number }>
}

function ExpenseCard({ expense, memberMap }: ExpenseCardProps) {
  const payerMember = memberMap.get(expense.payerId)

  return (
    <div style={cardStyles.card}>
      <div style={cardStyles.topRow}>
        <Avatar
          name={expense.payerName}
          colorIndex={payerMember?.colorIndex ?? 0}
          size={40}
        />
        <div style={cardStyles.info}>
          <span style={cardStyles.title}>{expense.title}</span>
          <span style={cardStyles.payer}>{expense.payerName} 결제</span>
        </div>
        <span style={cardStyles.amount}>{formatWon(expense.amount)}</span>
      </div>

      {expense.shareMemberIds.length > 0 && (
        <div style={cardStyles.shareRow}>
          <span style={cardStyles.shareLabel}>
            분담 {expense.shareMemberIds.length}명
          </span>
          <div style={cardStyles.shareAvatars}>
            {expense.shareMemberIds.map((id) => {
              const m = memberMap.get(id)
              return (
                <Avatar
                  key={id}
                  name={m?.name ?? '?'}
                  colorIndex={m?.colorIndex ?? 0}
                  size={26}
                />
              )
            })}
          </div>
        </div>
      )}
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
    padding: `0 ${spacing.xl} ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  settledBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: radius.full,
    backgroundColor: colors.bgDark,
    color: colors.textOnDark,
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
  },
  totalLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  expenseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  empty: {
    textAlign: 'center',
    padding: `${spacing['3xl']} 0`,
    color: colors.textTertiary,
    fontSize: typography.md,
  },
  readonlyHint: {
    textAlign: 'center',
    fontSize: typography.sm,
    color: colors.textTertiary,
    margin: `${spacing.lg} 0 0`,
  },
}

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: `${spacing.lg} ${spacing.lg}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  payer: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: typography.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flexShrink: 0,
  },
  shareRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTop: `1px solid ${colors.divider}`,
  },
  shareLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  shareAvatars: {
    display: 'flex',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
}
