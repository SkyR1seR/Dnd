import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export function NumInput({
  value,
  onChange,
  min,
  max,
  className = '',
  ariaLabel,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  className?: string
  ariaLabel?: string
}) {
  const [text, setText] = useState(String(value))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(String(value))
  }, [value])
  const commit = (t: string) => {
    let n = parseInt(t, 10)
    if (Number.isNaN(n)) n = min ?? 0
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)
    onChange(n)
    return n
  }
  return (
    <input
      className={`num ${className}`}
      inputMode="numeric"
      aria-label={ariaLabel}
      value={text}
      onFocus={(e) => {
        focused.current = true
        e.target.select()
      }}
      onChange={(e) => {
        setText(e.target.value)
        if (/^-?\d+$/.test(e.target.value)) commit(e.target.value)
      }}
      onBlur={() => {
        focused.current = false
        setText(String(commit(text)))
      }}
    />
  )
}

export function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  list,
  className = '',
}: {
  value: string
  onChange: (s: string) => void
  placeholder?: string
  list?: string
  className?: string
}) {
  return (
    <input
      className={className}
      value={value}
      placeholder={placeholder}
      list={list}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string
  onChange: (s: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function Section({
  title,
  actions,
  children,
  className = '',
}: {
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card ${className}`}>
      <header className="card-head">
        <h3>{title}</h3>
        {actions && <div className="card-actions">{actions}</div>}
      </header>
      {children}
    </section>
  )
}

/** Ряд «кружков» — для спасбросков от смерти, ячеек, ресурсов */
export function Pips({
  total,
  filled,
  onChange,
  kind = '',
  label,
}: {
  total: number
  filled: number
  onChange: (n: number) => void
  kind?: string
  label?: string
}) {
  if (total > 20) {
    return (
      <div className="pips-counter">
        <button className="btn sm" onClick={() => onChange(Math.max(0, filled - 1))}>
          −
        </button>
        <span>
          {filled} / {total}
        </span>
        <button className="btn sm" onClick={() => onChange(Math.min(total, filled + 1))}>
          +
        </button>
      </div>
    )
  }
  return (
    <div className="pips" role="group" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          className={`pip ${kind} ${i < filled ? 'on' : ''}`}
          aria-label={`${i + 1}`}
          aria-pressed={i < filled}
          onClick={() => onChange(i < filled && i === filled - 1 ? i : i + 1)}
        />
      ))}
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="card-head">
          <h3>{title}</h3>
          <button className="btn ghost sm" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function ProfToggle({
  level,
  onChange,
  allowExpertise = true,
}: {
  level: number
  onChange: (n: 0 | 1 | 2) => void
  allowExpertise?: boolean
}) {
  const next = ((level + 1) % (allowExpertise ? 3 : 2)) as 0 | 1 | 2
  const title = level === 2 ? 'Компетентность' : level === 1 ? 'Владение' : 'Нет владения'
  return (
    <button
      className={`prof prof-${level}`}
      title={`${title} (нажмите, чтобы изменить)`}
      aria-label={title}
      onClick={() => onChange(next)}
    />
  )
}
