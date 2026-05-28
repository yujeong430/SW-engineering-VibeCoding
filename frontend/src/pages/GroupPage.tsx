import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Lock, Plus } from 'lucide-react'
import api from '../lib/axios'
import { formatWon } from '../lib/format'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import type { CommonResponse } from '../types/common'
import type { GroupDetail } from '../types/group'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

export default function GroupPage() {
  const navigate = useNavigate()
  const { uuid = '' } = useParams()
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api
      .get<CommonResponse<GroupDetail>>(`/groups/${uuid}`)
      .then((res) => {
        if (active) setGroup(res.data.data)
      })
      .catch((e: unknown) => {
        const err = e as { response?: { data?: CommonResponse<null> } }
        if (active) setError(err.response?.data?.message ?? '그룹을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [uuid])

  const colorIndexOf = useMemo(() => {
    const map = new Map<number, number>()
    group?.members.forEach((m, i) => map.set(m.id, i))
    return (memberId: number) => map.get(memberId) ?? 0
  }, [group])

  const total = useMemo(
    () => group?.expenses.reduce((sum, e) => sum + e.amount, 0) ?? 0,
    [group],
  )

  if (loading) {
    return <div style={styles.center}>불러오는 중…</div>
  }

  if (error || !group) {
    return <div style={styles.center}>{error || '그룹을 찾을 수 없습니다.'}</div>
  }

  const isSettled = group.status === 'SETTLED'

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={() => navigate(-1)} aria-label="뒤로 가기">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <button style={styles.hostBtn}>
          <Lock size={14} strokeWidth={2.5} />
          방장 전환
        </button>
      </header>

      <div style={styles.body}>
        <h1 style={styles.groupName}>{group.name}</h1>
        <span style={styles.statusBadge}>
          <span style={styles.statusDot} />
          {isSettled ? '정산 완료' : '정산 중'}
        </span>

        <div style={styles.memberRow}>
          {group.members.map((m, i) => (
            <Avatar key={m.id} name={m.name} colorIndex={i} size={52} showName />
          ))}
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryCol}>
            <span style={styles.summaryLabel}>지금까지 모인 지출</span>
            <span style={styles.summaryAmount}>{formatWon(total)}</span>
          </div>
          <div style={{ ...styles.summaryCol, alignItems: 'flex-end' }}>
            <span style={styles.summaryLabel}>멤버</span>
            <span style={styles.summaryAmount}>{group.members.length}명</span>
          </div>
        </div>

        <span style={styles.listLabel}>지출 내역 {group.expenses.length}건</span>

        <ul style={styles.expenseList}>
          {group.expenses.map((e, i) => (
            <li
              key={e.id}
              style={{
                ...styles.expenseItem,
                ...(i === group.expenses.length - 1 ? { borderBottom: 'none' } : {}),
              }}
            >
              <Avatar name={e.payerName} colorIndex={colorIndexOf(e.payerId)} size={40} />
              <div style={styles.expenseInfo}>
                <span style={styles.expenseTitle}>{e.title}</span>
                <span style={styles.expenseMeta}>
                  {e.payerName} 결제 · {e.shareMemberIds.length}명 분담
                </span>
              </div>
              <span style={styles.expenseAmount}>{formatWon(e.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.footer}>
        <Button onClick={() => navigate(`/groups/${uuid}/expenses/new`)}>
          <span style={styles.addBtnInner}>
            <Plus size={18} strokeWidth={2.5} />
            지출 추가
          </span>
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
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.lg} ${spacing.xl}`,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textPrimary,
    cursor: 'pointer',
  },
  hostBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
  },
  body: {
    flex: 1,
    padding: `0 ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
  },
  groupName: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  memberRow: {
    display: 'flex',
    gap: spacing.lg,
    overflowX: 'auto',
    padding: `${spacing.xl} 0`,
  },
  summaryCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.xl} ${spacing.xl}`,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSummary,
  },
  summaryCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.sm,
    color: colors.textOnDarkSecondary,
  },
  summaryAmount: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textOnDark,
  },
  listLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    margin: `${spacing['2xl']} 0 ${spacing.md}`,
  },
  expenseList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  expenseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.lg} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.divider}`,
  },
  expenseInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  expenseTitle: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  expenseMeta: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  expenseAmount: {
    fontSize: typography.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flexShrink: 0,
  },
  footer: {
    position: 'sticky',
    bottom: 0,
    padding: `${spacing.lg} ${spacing.xl}`,
    paddingBottom: 32,
    backgroundColor: colors.bgLight,
  },
  addBtnInner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
}
