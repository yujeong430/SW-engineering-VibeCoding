import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Copy, Lock } from 'lucide-react'
import api from '../lib/axios'
import { formatWon } from '../lib/format'
import AppHeader from '../components/AppHeader'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import type { CommonResponse } from '../types/common'
import type { GroupDetail } from '../types/group'
import type { SettlementResult, Transfer } from '../types/settlement'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

export default function SettlementPage() {
  const navigate = useNavigate()
  const { uuid = '' } = useParams()

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [settlement, setSettlement] = useState<SettlementResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [groupRes, settleRes] = await Promise.all([
          api.get<CommonResponse<GroupDetail>>(`/groups/${uuid}`),
          api.get<CommonResponse<SettlementResult>>(`/groups/${uuid}/settlement`),
        ])
        setGroup(groupRes.data.data)
        setSettlement(settleRes.data.data)
      } catch (e: unknown) {
        const err = e as { response?: { data?: CommonResponse<null> } }
        setError(err.response?.data?.message ?? '정산 결과를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [uuid])

  // 멤버 id → { name, colorIndex } 맵
  const memberMap = useMemo(() => {
    const map = new Map<number, { name: string; colorIndex: number }>()
    group?.members.forEach((m, i) => map.set(m.id, { name: m.name, colorIndex: i }))
    return map
  }, [group])

  // 총 이동 금액
  const totalTransferAmount = useMemo(
    () => settlement?.transfers.reduce((s, t) => s + t.amount, 0) ?? 0,
    [settlement],
  )

  const copyAccount = async (transfer: Transfer) => {
    if (!transfer.toAccount) return
    const text = `${transfer.toAccount.bankName} ${transfer.toAccount.accountNo}`
    const key = `${transfer.fromMemberId}-${transfer.toMemberId}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(key)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // clipboard 권한 없을 때 fallback
    }
  }

  if (loading) return <div style={styles.center}>불러오는 중…</div>
  if (error || !group || !settlement) {
    return <div style={styles.center}>{error || '정산 결과를 불러오지 못했습니다.'}</div>
  }

  const transferCount = settlement.transfers.length

  return (
    <div style={styles.container}>
      <AppHeader title="정산 결과" onBack={() => navigate(`/groups/${uuid}`)} />

      <div style={styles.body}>
        {/* 상단 다크 카드 */}
        <div style={styles.heroCard}>
          <div style={styles.heroMeta}>
            <Lock size={13} strokeWidth={2.5} color="rgba(255,255,255,0.7)" />
            <span style={styles.heroMetaText}>
              정산 완료 · {group.name}
            </span>
          </div>
          <p style={styles.heroTitle}>
            <span style={styles.heroAccent}>{transferCount}번</span>만 보내면{'\n'}정산이 끝나요
          </p>
          <p style={styles.heroSub}>
            총 {formatWon(totalTransferAmount)} 이동 · {group.members.length}명 정산
          </p>
        </div>

        {/* 송금 목록 */}
        {settlement.transfers.length > 0 && (
          <section style={styles.section}>
            <span style={styles.sectionLabel}>이렇게 보내면 끝나요</span>

            <div style={styles.transferList}>
              {settlement.transfers.map((t) => {
                const fromMember = memberMap.get(t.fromMemberId)
                const toMember = memberMap.get(t.toMemberId)
                const copyKey = `${t.fromMemberId}-${t.toMemberId}`
                const isCopied = copiedId === copyKey

                return (
                  <div key={copyKey} style={styles.transferCard}>
                    <div style={styles.transferRow}>
                      <div style={styles.transferParties}>
                        <Avatar
                          name={t.fromName}
                          colorIndex={fromMember?.colorIndex ?? 0}
                          size={36}
                        />
                        <div style={styles.transferNames}>
                          <span style={styles.fromName}>{t.fromName}</span>
                          <span style={styles.arrow}>→</span>
                          <span style={styles.toName}>{t.toName}</span>
                          <Avatar
                            name={t.toName}
                            colorIndex={toMember?.colorIndex ?? 1}
                            size={36}
                          />
                        </div>
                      </div>
                      <span style={styles.transferAmount}>{formatWon(t.amount)}</span>
                    </div>

                    {t.toAccount ? (
                      <div style={styles.accountRow}>
                        <span style={styles.accountText}>
                          {t.toAccount.bankName} {t.toAccount.accountNo}
                        </span>
                        <button
                          style={styles.copyBtn}
                          onClick={() => copyAccount(t)}
                        >
                          <Copy size={13} strokeWidth={2.5} />
                          {isCopied ? '복사됨' : '계좌 복사'}
                        </button>
                      </div>
                    ) : (
                      <div style={styles.accountRow}>
                        <span style={styles.noAccountText}>계좌 미등록</span>
                        <button
                          style={styles.registerAccountBtn}
                          onClick={() =>
                            navigate(`/groups/${uuid}/members/${t.toMemberId}/account`, {
                              state: { from: 'settlement' },
                            })
                          }
                        >
                          계좌 등록하기 →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 멤버별 잔액 */}
        {settlement.balances.length > 0 && (
          <section style={styles.section}>
            <span style={styles.sectionLabel}>멤버별 잔액</span>

            <div style={styles.balanceList}>
              {settlement.balances
                .slice()
                .sort((a, b) => b.netBalance - a.netBalance)
                .map((b) => {
                  const m = memberMap.get(b.memberId)
                  const isPositive = b.netBalance > 0
                  return (
                    <div key={b.memberId} style={styles.balanceItem}>
                      <Avatar
                        name={m?.name ?? '?'}
                        colorIndex={m?.colorIndex ?? 0}
                        size={40}
                      />
                      <div style={styles.balanceInfo}>
                        <span style={styles.balanceName}>{m?.name ?? '알 수 없음'}</span>
                        <span style={styles.balanceRole}>
                          {isPositive ? '받을 돈' : '보낼 돈'}
                        </span>
                      </div>
                      <span
                        style={{
                          ...styles.balanceAmount,
                          color: isPositive ? colors.positive : colors.negative,
                        }}
                      >
                        {isPositive ? '+' : ''}
                        {formatWon(b.netBalance)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </section>
        )}
      </div>

      <div style={styles.footer}>
        <Button
          variant="outline"
          onClick={() => navigate(`/groups/${uuid}/expenses`)}
        >
          지출 내역 보기
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
    padding: `0 ${spacing.xl} ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xl'],
  },
  heroCard: {
    backgroundColor: colors.bgDark,
    borderRadius: radius.lg,
    padding: `${spacing.xl} ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  heroMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroMetaText: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: fontWeight.medium,
  },
  heroTitle: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textOnDark,
    margin: `${spacing.xs} 0 0`,
    lineHeight: 1.3,
    whiteSpace: 'pre-line',
  },
  heroAccent: {
    color: colors.primary,
  },
  heroSub: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.55)',
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  transferList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  transferCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: `${spacing.lg} ${spacing.lg}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  transferRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transferParties: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  transferNames: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  fromName: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  arrow: {
    fontSize: typography.md,
    color: colors.textTertiary,
    flexShrink: 0,
  },
  toName: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  transferAmount: {
    fontSize: typography.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
  accountRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  accountText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    color: colors.textOnDark,
    fontSize: typography.sm,
    fontWeight: fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  noAccountText: {
    fontSize: typography.sm,
    color: colors.textTertiary,
  },
  registerAccountBtn: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  balanceList: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  balanceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.lg} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.divider}`,
  },
  balanceInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  balanceName: {
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  balanceRole: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  balanceAmount: {
    fontSize: typography.md,
    fontWeight: fontWeight.bold,
    flexShrink: 0,
  },
  footer: {
    padding: `${spacing.lg} ${spacing.xl}`,
    paddingBottom: 32,
  },
}
