import { useEffect, useState } from 'react'
import { describeRoll, parseDice } from '../../lib/dice'
import type { LogEntry } from '../../state/rolls'
import { useRolls } from '../../state/rolls'
import { Section } from '../ui'

const DICE = [4, 6, 8, 10, 12, 20, 100]

export function DiceTray() {
  const rolls = useRolls()
  const [expr, setExpr] = useState('')
  const valid = !expr || !!parseDice(expr)
  const submit = () => {
    if (expr && valid) rolls.dice(expr, expr)
  }
  return (
    <Section title="Кубики">
      <div className="dice-grid">
        {DICE.map((d) => (
          <button
            key={d}
            className="die-btn"
            onClick={() =>
              d === 20
                ? rolls.d20('d20', 0, { kind: 'plain' })
                : rolls.dice(`d${d}`, `1d${d}`)
            }
          >
            d{d}
          </button>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          className={`grow ${valid ? '' : 'invalid'}`}
          placeholder="Например: 2d6+3"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          aria-label="Выражение для броска"
        />
        <button className="btn primary" disabled={!expr || !valid}>
          Бросить
        </button>
      </form>
    </Section>
  )
}

function EntryBody({ e, big = false }: { e: LogEntry; big?: boolean }) {
  const rolls = useRolls()
  if (e.d20) {
    const r = e.d20
    const [first, second] = r.rolls
    return (
      <div className="entry-body">
        <div className={`total ${big ? 'big' : ''} ${r.crit ? 'crit' : r.fumble ? 'fumble' : ''}`}>
          {e.autoFail ? 'Провал' : r.total}
        </div>
        <div className="detail">
          d20:{' '}
          {second === undefined ? (
            <b>{first}</b>
          ) : (
            <>
              <span className={first === r.kept ? 'kept' : 'dropped'}>{first}</span>
              {' / '}
              <span className={second === r.kept && first !== r.kept ? 'kept' : 'dropped'}>
                {second}
              </span>
            </>
          )}
          {r.modifier !== 0 && ` ${r.modifier > 0 ? '+' : '−'} ${Math.abs(r.modifier)}`}
          {r.mode === 'advantage' && <span className="tag adv">преимущество</span>}
          {r.mode === 'disadvantage' && <span className="tag dis">помеха</span>}
          {r.crit && <span className="tag crit">крит!</span>}
          {r.fumble && <span className="tag fumble">1</span>}
        </div>
        {e.followUp && (
          <button
            className="btn xs"
            onClick={() => rolls.dice(e.followUp!.label, e.followUp!.expr, e.followUp!.crit)}
          >
            {e.followUp.crit ? 'Крит. урон' : 'Урон'}: {e.followUp.expr}
          </button>
        )}
      </div>
    )
  }
  if (e.dice) {
    return (
      <div className="entry-body">
        <div className={`total ${big ? 'big' : ''}`}>{e.dice.total}</div>
        <div className="detail">
          {describeRoll(e.dice)}
          {e.crit && <span className="tag crit">крит ×2 кости</span>}
        </div>
      </div>
    )
  }
  return null
}

export function RollLog() {
  const { log, clear } = useRolls()
  return (
    <Section
      title="Журнал"
      actions={
        log.length > 0 && (
          <button className="btn ghost xs" onClick={clear}>
            Очистить
          </button>
        )
      }
    >
      {log.length === 0 && <p className="empty">Здесь появятся результаты бросков.</p>}
      <ol className="log">
        {log.map((e) => (
          <li key={e.id} className="log-entry">
            <div className="log-head">
              <span className="log-label">{e.label}</span>
              <time className="muted small">
                {new Date(e.time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
            <EntryBody e={e} />
            {e.notes && e.notes.length > 0 && (
              <ul className="log-notes">
                {e.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </Section>
  )
}

/** Всплывающий результат последнего броска */
export function RollToast() {
  const { last, dismiss } = useRolls()
  useEffect(() => {
    if (!last) return
    const t = setTimeout(dismiss, last.followUp ? 8000 : 4500)
    return () => clearTimeout(t)
  }, [last, dismiss])
  if (!last || (!last.d20 && !last.dice && !last.notes?.length)) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="log-head">
        <span className="log-label">{last.label}</span>
        <button className="btn ghost xs" onClick={dismiss} aria-label="Скрыть">
          ✕
        </button>
      </div>
      <EntryBody e={last} big />
      {last.notes && last.notes.length > 0 && (
        <ul className="log-notes">
          {last.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
