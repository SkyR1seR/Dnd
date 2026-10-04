import { useState } from 'react'
import { applyDamage, heal, setTempHp } from '../../lib/actions'
import {
  effectiveMaxHp,
  effectiveSpeed,
  fmtMod,
  initiative,
  passive,
  pb,
  totalLevel,
} from '../../lib/calc'
import { useRolls } from '../../state/rolls'
import { useChar } from '../../state/store'
import type { RollMode } from '../../types'
import { Pips, Section } from '../ui'

export function PlayHeader() {
  const { c, set } = useChar()
  const rolls = useRolls()
  const maxHp = effectiveMaxHp(c)
  const pct = Math.max(0, Math.min(100, (c.hp.current / Math.max(1, maxHp)) * 100))
  const classes = c.classes
    .filter((cl) => cl.name)
    .map((cl) => `${cl.name} ${cl.level}`)
    .join(' / ')
  return (
    <div className="play-header">
      <div className="ph-id">
        <div className="ph-name">{c.name}</div>
        <div className="muted small">
          {[c.race, classes || `Уровень ${totalLevel(c)}`].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="ph-hp" title="Хиты">
        <div className="hp-bar">
          <div
            className={`hp-fill ${pct <= 25 ? 'low' : pct <= 50 ? 'mid' : ''}`}
            style={{ width: `${pct}%` }}
          />
          {c.hp.temp > 0 && <div className="hp-temp" />}
        </div>
        <div className="hp-text">
          <strong>{c.hp.current}</strong>/{maxHp}
          {c.hp.temp > 0 && <span className="temp"> +{c.hp.temp}</span>}
        </div>
      </div>
      <div className="ph-stats">
        <div className="stat-chip" title="Класс доспеха">
          <span>КД</span>
          <strong>{c.ac}</strong>
        </div>
        <button
          className="stat-chip btnlike"
          title="Бросить инициативу"
          onClick={() => rolls.d20('Инициатива', initiative(c), { kind: 'init' })}
        >
          <span>Иниц.</span>
          <strong>{fmtMod(initiative(c))}</strong>
        </button>
        <div className="stat-chip" title="Скорость">
          <span>Скор.</span>
          <strong>{effectiveSpeed(c)}</strong>
        </div>
        <div className="stat-chip" title="Бонус мастерства">
          <span>БМ</span>
          <strong>{fmtMod(pb(c))}</strong>
        </div>
        <div className="stat-chip" title="Пассивная Мудрость (Восприятие)">
          <span>Пасс.</span>
          <strong>{passive(c, 'perception')}</strong>
        </div>
        <button
          className={`stat-chip btnlike ${c.inspiration ? 'lit' : ''}`}
          title="Вдохновение"
          aria-pressed={c.inspiration}
          onClick={() => set((d) => void (d.inspiration = !d.inspiration))}
        >
          <span>Вдохн.</span>
          <strong>{c.inspiration ? '★' : '☆'}</strong>
        </button>
      </div>
      <RollModeSwitch mode={rolls.mode} onChange={rolls.setMode} />
    </div>
  )
}

function RollModeSwitch({ mode, onChange }: { mode: RollMode; onChange: (m: RollMode) => void }) {
  const opts: { m: RollMode; label: string; title: string }[] = [
    { m: 'disadvantage', label: 'Помеха', title: 'Следующий бросок d20 с помехой' },
    { m: 'normal', label: 'Обычный', title: 'Обычный бросок' },
    { m: 'advantage', label: 'Преим.', title: 'Следующий бросок d20 с преимуществом' },
  ]
  return (
    <div className="segmented" role="radiogroup" aria-label="Режим броска">
      {opts.map((o) => (
        <button
          key={o.m}
          role="radio"
          aria-checked={mode === o.m}
          title={o.title}
          className={`${mode === o.m ? 'active' : ''} mode-${o.m}`}
          onClick={() => onChange(o.m)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function HpPanel() {
  const { c, set } = useChar()
  const rolls = useRolls()
  const [amount, setAmount] = useState('')
  const n = Math.max(0, parseInt(amount, 10) || 0)
  const act = (fn: 'dmg' | 'heal' | 'temp') => {
    if (!n) return
    const log = set((d) => {
      if (fn === 'dmg') return applyDamage(d, n)
      if (fn === 'heal') return heal(d, n)
      setTempHp(d, n)
      return []
    })
    const label =
      fn === 'dmg' ? `Получено урона: ${n}` : fn === 'heal' ? `Лечение: ${n}` : `Временные хиты: ${n}`
    rolls.note(label, log)
    setAmount('')
  }
  const down = c.hp.current === 0
  const dead = c.deathSaves.failures >= 3
  return (
    <Section title="Хиты" className={down ? 'danger-card' : ''}>
      <div className="hp-big">
        <span className="hp-cur">{c.hp.current}</span>
        <span className="muted">/ {effectiveMaxHp(c)}</span>
        {c.hp.temp > 0 && <span className="temp">+{c.hp.temp} врем.</span>}
      </div>
      <div className="hp-controls">
        <input
          className="num hp-input"
          inputMode="numeric"
          placeholder="0"
          aria-label="Количество"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && act('dmg')}
        />
        <button className="btn danger" onClick={() => act('dmg')} disabled={!n}>
          Урон
        </button>
        <button className="btn success" onClick={() => act('heal')} disabled={!n}>
          Лечение
        </button>
        <button className="btn" onClick={() => act('temp')} disabled={!n}>
          Врем.
        </button>
      </div>
      <div className="quick-row">
        {[1, 5, 10].map((v) => (
          <button key={v} className="btn ghost xs" onClick={() => setAmount(String(n + v))}>
            +{v}
          </button>
        ))}
        {c.hp.temp > 0 && (
          <button className="btn ghost xs" onClick={() => set((d) => void (d.hp.temp = 0))}>
            Сбросить врем.
          </button>
        )}
      </div>
      {(down || c.deathSaves.successes > 0 || c.deathSaves.failures > 0) && (
        <DeathSaves dead={dead} />
      )}
    </Section>
  )
}

function DeathSaves({ dead }: { dead: boolean }) {
  const { c, set } = useChar()
  const rolls = useRolls()
  const stable = c.deathSaves.successes >= 3
  const rollSave = () => {
    const e = rolls.d20('Спасбросок от смерти', 0, { kind: 'death' })
    const r = e.d20!.kept
    set((d) => {
      if (r === 20) {
        d.hp.current = 1
        d.deathSaves = { successes: 0, failures: 0 }
        d.conditions = d.conditions.filter((k) => k !== 'unconscious')
      } else if (r === 1) d.deathSaves.failures = Math.min(3, d.deathSaves.failures + 2)
      else if (r >= 10) d.deathSaves.successes = Math.min(3, d.deathSaves.successes + 1)
      else d.deathSaves.failures = Math.min(3, d.deathSaves.failures + 1)
    })
  }
  return (
    <div className="death-saves">
      <div className="ds-row">
        <span>Успехи</span>
        <Pips
          total={3}
          filled={c.deathSaves.successes}
          kind="good"
          label="Успехи"
          onChange={(v) => set((d) => void (d.deathSaves.successes = v))}
        />
      </div>
      <div className="ds-row">
        <span>Провалы</span>
        <Pips
          total={3}
          filled={c.deathSaves.failures}
          kind="bad"
          label="Провалы"
          onChange={(v) => set((d) => void (d.deathSaves.failures = v))}
        />
      </div>
      {dead ? (
        <p className="warn">Персонаж погиб.</p>
      ) : stable ? (
        <p className="ok">Персонаж стабилизирован.</p>
      ) : (
        c.hp.current === 0 && (
          <button className="btn primary" onClick={rollSave}>
            Спасбросок от смерти
          </button>
        )
      )}
      <button
        className="btn ghost xs"
        onClick={() => set((d) => void (d.deathSaves = { successes: 0, failures: 0 }))}
      >
        Сбросить
      </button>
    </div>
  )
}
