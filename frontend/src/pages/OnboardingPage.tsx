import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { colors, typography, fontWeight, spacing, radius } from '../styles/tokens'

export default function OnboardingPage() {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <div style={styles.brand}>
        <span style={styles.logoMark} />
        <span style={styles.brandName}>GroupPay</span>
      </div>

      <div style={styles.hero}>
        <h1 style={styles.title}>
          모임 정산,<br />
          링크 하나로<br />
          끝<span style={styles.accent}>.</span>
        </h1>
        <p style={styles.subtitle}>
          가입도 로그인도 없이.<br />
          누가 누구에게 얼마를 보낼지<br />
          가장 적은 송금으로 정리해 드려요.
        </p>
      </div>

      <div style={styles.actions}>
        <Button onClick={() => navigate('/groups/new')}>새 그룹 만들기</Button>
        <p style={styles.hint}>링크를 받은 누구나 바로 들어올 수 있어요</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    padding: `${spacing['2xl']} ${spacing.xl} 32px`,
    backgroundColor: colors.bgBlack,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  logoMark: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    background: `linear-gradient(90deg, ${colors.primary} 0 50%, ${colors.textOnDark} 50% 100%)`,
  },
  brandName: {
    fontSize: typography.lg,
    fontWeight: fontWeight.bold,
    color: colors.textOnDark,
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  title: {
    fontSize: typography['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textOnDark,
    lineHeight: 1.3,
    margin: 0,
  },
  accent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textOnDarkSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  hint: {
    fontSize: typography.sm,
    color: colors.textOnDarkSecondary,
    margin: 0,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
}
