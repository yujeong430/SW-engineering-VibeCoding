import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { colors, typography, fontWeight, spacing, radius, shadow } from '../styles/tokens'

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
}

export default function Select({ value, onChange, options, placeholder = '선택' }: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (option: string) => {
    onChange(option)
    setOpen(false)
  }

  return (
    <div ref={ref} style={styles.wrapper}>
      <button
        type="button"
        style={{
          ...styles.trigger,
          color: value ? colors.textPrimary : colors.textTertiary,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{value || placeholder}</span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          color={colors.textTertiary}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 200ms ease',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <ul style={styles.list} role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              style={{
                ...styles.item,
                backgroundColor: value === opt ? 'rgba(0, 102, 204, 0.06)' : 'transparent',
              }}
              onMouseDown={() => handleSelect(opt)}
            >
              <span
                style={{
                  ...styles.itemLabel,
                  fontWeight: value === opt ? fontWeight.semibold : fontWeight.regular,
                  color: value === opt ? colors.primary : colors.textPrimary,
                }}
              >
                {opt}
              </span>
              {value === opt && (
                <Check size={16} strokeWidth={2.5} color={colors.primary} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    position: 'relative',
  },
  trigger: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.lg} ${spacing.lg}`,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgCard,
    fontSize: typography.lg,
    cursor: 'pointer',
    textAlign: 'left',
  },
  list: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    boxShadow: shadow.sheet,
    border: `1px solid ${colors.border}`,
    maxHeight: 240,
    overflowY: 'auto',
    zIndex: 50,
    margin: 0,
    padding: `${spacing.xs} 0`,
    listStyle: 'none',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md} ${spacing.lg}`,
    cursor: 'pointer',
    transition: 'background-color 100ms ease',
  },
  itemLabel: {
    fontSize: typography.md,
  },
}
