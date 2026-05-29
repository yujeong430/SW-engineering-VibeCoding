import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  Lock,
  Plus,
  Crown,
  Pencil,
  Check,
  X,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import api from '../lib/axios'
import { formatWon } from '../lib/format'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import PinAuthSheet from '../components/PinAuthSheet'
import ConfirmModal from '../components/ConfirmModal'
import type { CommonResponse } from '../types/common'
import type { GroupDetail } from '../types/group'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

export default function GroupPage() {
  const navigate = useNavigate()
  const { uuid = '' } = useParams()
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const [showAuth, setShowAuth] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteGroup, setShowDeleteGroup] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [memberInput, setMemberInput] = useState('')
  const [manageMembers, setManageMembers] = useState(false)
  const [manageExpenses, setManageExpenses] = useState(false)
  const memberInputRef = useRef<HTMLInputElement>(null)

  const fetchGroup = useCallback(async () => {
    try {
      const res = await api.get<CommonResponse<GroupDetail>>(`/groups/${uuid}`)
      setGroup(res.data.data)
    } catch (e: unknown) {
      const err = e as { response?: { data?: CommonResponse<null> } }
      setError(err.response?.data?.message ?? '그룹을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [uuid])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  const colorIndexOf = useMemo(() => {
    const map = new Map<number, number>()
    group?.members.forEach((m, i) => map.set(m.id, i))
    return (memberId: number) => map.get(memberId) ?? 0
  }, [group])

  const total = useMemo(
    () => group?.expenses.reduce((sum, e) => sum + e.amount, 0) ?? 0,
    [group],
  )

  // 계좌 등록 가능한 멤버 = 지출을 낸 멤버(payer) (FR-07)
  const payerIds = useMemo(
    () => new Set(group?.expenses.map((e) => e.payerId) ?? []),
    [group],
  )

  const withError = async (fn: () => Promise<void>, fallback: string) => {
    setActionError('')
    try {
      await fn()
    } catch (e: unknown) {
      const err = e as { response?: { data?: CommonResponse<null> } }
      setActionError(err.response?.data?.message ?? fallback)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuth(false)
    fetchGroup()
  }

  const startEditName = () => {
    if (!group) return
    setNameInput(group.name)
    setEditingName(true)
  }

  const saveName = () =>
    withError(async () => {
      const name = nameInput.trim()
      if (!name) return
      await api.patch(`/groups/${uuid}`, { name })
      setEditingName(false)
      await fetchGroup()
    }, '그룹명 수정에 실패했습니다.')

  const addMember = () =>
    withError(async () => {
      const name = memberInput.trim()
      if (!name) return
      await api.post(`/groups/${uuid}/members`, { name })
      setMemberInput('')
      memberInputRef.current?.focus()
      await fetchGroup()
    }, '멤버 추가에 실패했습니다.')

  const removeMember = (id: number) =>
    withError(async () => {
      await api.delete(`/groups/${uuid}/members/${id}?force=true`)
      await fetchGroup()
    }, '멤버 삭제에 실패했습니다.')

  const deleteExpense = (id: number) =>
    withError(async () => {
      await api.delete(`/groups/${uuid}/expenses/${id}`)
      await fetchGroup()
    }, '지출 삭제에 실패했습니다.')

  const deleteGroup = () =>
    withError(async () => {
      await api.delete(`/groups/${uuid}`)
      navigate('/')
    }, '그룹 삭제에 실패했습니다.')

  if (loading) {
    return <div style={styles.center}>불러오는 중…</div>
  }
  if (error || !group) {
    return <div style={styles.center}>{error || '그룹을 찾을 수 없습니다.'}</div>
  }

  const { isHost } = group
  const isSettled = group.status === 'SETTLED'
  const canManage = isHost && !isSettled

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={() => navigate(-1)} aria-label="뒤로 가기">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        {isHost ? (
          <div style={{ position: 'relative' }}>
            <button
              style={styles.iconBtn}
              onClick={() => setShowMenu((v) => !v)}
              aria-label="그룹 메뉴"
            >
              <MoreHorizontal size={22} strokeWidth={2.5} />
            </button>
            {showMenu && (
              <div style={styles.menu}>
                <button
                  style={styles.menuItem}
                  onClick={() => {
                    setShowMenu(false)
                    setShowDeleteGroup(true)
                  }}
                >
                  <Trash2 size={16} strokeWidth={2} />
                  그룹 삭제
                </button>
              </div>
            )}
          </div>
        ) : (
          <button style={styles.hostBtn} onClick={() => setShowAuth(true)}>
            <Lock size={14} strokeWidth={2.5} />
            방장 전환
          </button>
        )}
      </header>

      <div style={styles.body}>
        <div style={styles.nameRow}>
          {editingName ? (
            <div style={styles.nameEdit}>
              <input
                style={styles.nameInput}
                value={nameInput}
                maxLength={50}
                autoFocus
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
              />
              <button style={styles.nameIconBtn} onClick={saveName} aria-label="저장">
                <Check size={20} strokeWidth={2.5} color={colors.primary} />
              </button>
              <button
                style={styles.nameIconBtn}
                onClick={() => setEditingName(false)}
                aria-label="취소"
              >
                <X size={20} strokeWidth={2.5} color={colors.textTertiary} />
              </button>
            </div>
          ) : (
            <div style={styles.nameDisplay}>
              <h1 style={styles.groupName}>{group.name}</h1>
              {canManage && (
                <button style={styles.nameIconBtn} onClick={startEditName} aria-label="그룹명 수정">
                  <Pencil size={18} strokeWidth={2} color={colors.textTertiary} />
                </button>
              )}
            </div>
          )}
          {isHost && (
            <span style={styles.hostBadge}>
              <Crown size={14} strokeWidth={2.5} />
              방장
            </span>
          )}
        </div>

        <span style={styles.statusBadge}>
          <span style={styles.statusDot} />
          {isSettled ? '정산 완료' : '정산 중'}
        </span>

        <div style={styles.memberRow}>
          {group.members.map((m, i) => {
            const isPayer = payerIds.has(m.id)
            const tappable = !manageMembers && isPayer
            return (
              <div
                key={m.id}
                style={{
                  ...styles.memberItemWrap,
                  cursor: tappable ? 'pointer' : 'default',
                }}
                onClick={
                  tappable
                    ? () =>
                        navigate(`/groups/${uuid}/members/${m.id}/account`, {
                          state: { from: 'group' },
                        })
                    : undefined
                }
              >
                <Avatar name={m.name} colorIndex={i} size={52} showName />
                {manageMembers && (
                  <button
                    style={styles.removeMemberBtn}
                    onClick={() => removeMember(m.id)}
                    aria-label={`${m.name} 삭제`}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            )
          })}
          {manageMembers && (
            <button style={styles.addMemberChip} onClick={() => setAddingMember(true)}>
              <span style={styles.addCircle}>
                <Plus size={22} strokeWidth={2.5} color={colors.primary} />
              </span>
              <span style={styles.addLabel}>추가</span>
            </button>
          )}
        </div>

        {addingMember && (
          <div style={styles.addMemberRow}>
            <input
              ref={memberInputRef}
              style={styles.addMemberInput}
              placeholder="멤버 이름 (예: 지수)"
              maxLength={20}
              autoFocus
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
            />
            <button style={styles.addMemberConfirm} onClick={addMember}>
              추가
            </button>
            <button
              style={styles.addMemberCancel}
              onClick={() => {
                setAddingMember(false)
                setMemberInput('')
              }}
            >
              닫기
            </button>
          </div>
        )}

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

        <div style={styles.listHeader}>
          <span style={styles.listLabel}>지출 내역 {group.expenses.length}건</span>
          {canManage && group.expenses.length > 0 && (
            <button style={styles.editBtn} onClick={() => setManageExpenses((v) => !v)}>
              {manageExpenses ? '완료' : '편집'}
            </button>
          )}
        </div>

        {group.expenses.length === 0 ? (
          <div style={styles.empty}>아직 등록된 지출이 없어요</div>
        ) : (
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
                {manageExpenses && (
                  <button
                    style={styles.expenseDeleteBtn}
                    onClick={() => deleteExpense(e.id)}
                    aria-label={`${e.title} 삭제`}
                  >
                    <Trash2 size={18} strokeWidth={2} color={colors.negative} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {actionError && <p style={styles.actionError}>{actionError}</p>}
      </div>

      <div style={styles.footer}>
        {isHost && !isSettled && (
          <Button onClick={() => navigate(`/groups/${uuid}/settle`)}>정산하기</Button>
        )}
        {!isSettled && (
          <div style={styles.footerActions}>
            <Button
              variant={isHost ? 'text' : 'primary'}
              fullWidth={!isHost}
              onClick={() => navigate(`/groups/${uuid}/expenses/new`)}
            >
              <span style={styles.addBtnInner}>
                <Plus size={18} strokeWidth={2.5} />
                지출 추가
              </span>
            </Button>
            {isHost && (
              <Button
                variant="text"
                fullWidth={false}
                onClick={() => {
                  setManageMembers((v) => !v)
                  setAddingMember(false)
                  setMemberInput('')
                }}
              >
                {manageMembers ? '관리 완료' : '멤버 관리'}
              </Button>
            )}
          </div>
        )}
      </div>

      {showAuth && (
        <PinAuthSheet
          uuid={uuid}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showDeleteGroup && (
        <ConfirmModal
          title="그룹을 삭제할까요?"
          message="멤버·지출·정산 데이터가 모두 삭제되며 되돌릴 수 없어요."
          confirmLabel="삭제"
          cancelLabel="취소"
          destructive
          onConfirm={() => {
            setShowDeleteGroup(false)
            deleteGroup()
          }}
          onCancel={() => setShowDeleteGroup(false)}
        />
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
  menu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.14)',
    padding: spacing.xs,
    zIndex: 20,
    minWidth: 140,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    padding: `${spacing.md} ${spacing.md}`,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    color: colors.negative,
    fontSize: typography.md,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    border: 'none',
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
  hostBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: fontWeight.bold,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    padding: `0 ${spacing.xl}`,
    display: 'flex',
    flexDirection: 'column',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nameDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  nameEdit: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: typography.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
  },
  nameIconBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  groupName: {
    fontSize: typography['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  memberItemWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  removeMemberBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.negative,
    color: colors.textOnDark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  addMemberChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
  addCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    border: `1.5px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  addMemberRow: {
    display: 'flex',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  addMemberInput: {
    flex: 1,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
    fontSize: typography.md,
    color: colors.textPrimary,
  },
  addMemberConfirm: {
    flexShrink: 0,
    padding: `0 ${spacing.lg}`,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    color: colors.textOnDark,
    fontSize: typography.md,
    fontWeight: fontWeight.semibold,
    border: 'none',
    cursor: 'pointer',
  },
  addMemberCancel: {
    flexShrink: 0,
    padding: `0 ${spacing.md}`,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    fontSize: typography.md,
    cursor: 'pointer',
    border: 'none',
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
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: `${spacing['2xl']} 0 ${spacing.md}`,
  },
  listLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  editBtn: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  empty: {
    padding: `${spacing['3xl']} 0`,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: typography.md,
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
  expenseDeleteBtn: {
    flexShrink: 0,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  actionError: {
    fontSize: typography.sm,
    color: colors.negative,
    textAlign: 'center',
    margin: `${spacing.md} 0 0`,
  },
  footer: {
    position: 'sticky',
    bottom: 0,
    padding: `${spacing.lg} ${spacing.xl}`,
    paddingBottom: 32,
    backgroundColor: colors.bgLight,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  footerActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  addBtnInner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
}
