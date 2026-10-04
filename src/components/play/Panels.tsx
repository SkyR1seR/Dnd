import { useState } from 'react'
import { CONDITIONS, EXHAUSTION_LEVELS } from '../../data/conditions'
import { ABILITIES, ABILITY_NAMES, ABILITY_SHORT, SKILLS } from '../../data/rules'
import { longRest, shortRest, spendHitDie } from '../../lib/actions'
import {
  attackDamageExpr,
  attackToHit,
  effectiveMaxHp,
  fmtMod,
  mod,
  passive,
  saveBonus,
  skillBonus,
} from '../../lib/calc'
import { rollDie } from '../../lib/dice'
import { useRolls } from '../../state/rolls'
import { useChar } from '../../state/store'
import { Modal, Pips, Section } from '../ui'

export function ChecksPanel() {
  const { c } = useChar()
  const rolls = useRolls()
  return (
    <>
      <Section title="Характеристики">
        <div className="ab-grid">
          {ABILITIES.map((a) => (
            <div key={a} className="ab-cell">
              <div className="ab-head">
                <span className="ab-short">{ABILITY_SHORT[a]}</span>
                <span className="muted small">{c.abilities[a]}</span>
              </div>
              <button
                className="roll-btn"
                title={`Проверка: ${ABILITY_NAMES[a]}`}
                onClick={() =>
                  rolls.d20(`Проверка ${ABILITY_NAMES[a]}`, mod(c, a), { kind: 'check', ability: a })
                }
              >
                <small>Проверка</small>
                {fmtMod(mod(c, a))}
              </button>
              <button
                className={`roll-btn ${c.saveProf[a] ? 'is-prof' : ''}`}
                title={`Спасбросок: ${ABILITY_NAMES[a]}`}
                onClick={() =>
                  rolls.d20(`Спасбросок ${ABILITY_NAMES[a]}`, saveBonus(c, a), {
                    kind: 'save',
                    ability: a,
                  })
                }
              >
                <small>Спасбр.</small>
                {fmtMod(saveBonus(c, a))}
              </button>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Навыки">
        <div className="skill-buttons">
          {SKILLS.map((s) => {
            const lvl = c.skills[s.key]
            return (
              <button
                key={s.key}
                className={`skill-btn lvl-${lvl}`}
                onClick={() =>
                  rolls.d20(s.name, skillBonus(c, s.key), { kind: 'check', ability: s.ability })
                }
              >
                <span className="skill-btn-bonus">{fmtMod(skillBonus(c, s.key))}</span>
                <span className="skill-btn-name">{s.name}</span>
                <span className="muted small">{ABILITY_SHORT[s.ability]}</span>
              </button>
            )
          })}
        </div>
        <p className="hint">
          Пассивные: Восприятие {passive(c, 'perception')} · Проницательность{' '}
          {passive(c, 'insight')} · Расследование {passive(c, 'investigation')}
        </p>
      </Section>
    </>
  )
}

export function AttacksPanel() {
  const { c } = useChar()
  const rolls = useRolls()
  if (c.attacks.length === 0)
    return (
      <Section title="Атаки">
        <p className="empty">Добавьте атаки на вкладке «Лист → Атаки и ресурсы».</p>
      </Section>
    )
  return (
    <Section title="Атаки">
      <div className="attack-list">
        {c.attacks.map((a) => {
          const hit = attackToHit(c, a)
          const dmg = attackDamageExpr(c, a)
          const dmgLabel = `Урон: ${a.name}${a.damageType ? ` (${a.damageType})` : ''}`
          return (
            <div key={a.id} className="attack-row">
              <div className="attack-info">
                <div className="attack-name">{a.name}</div>
                {a.notes && <div className="muted small">{a.notes}</div>}
              </div>
              <button
                className="roll-btn wide"
                title="Бросок атаки"
                onClick={() =>
                  rolls.d20(`Атака: ${a.name}`, hit, { kind: 'attack' }, {
                    followUp: { label: dmgLabel, expr: dmg, crit: false },
                  })
                }
              >
                <small>Атака</small>
                {fmtMod(hit)}
              </button>
              <button
                className="roll-btn wide"
                title="Бросок урона"
                onClick={() => rolls.dice(dmgLabel, dmg)}
              >
                <small>{a.damageType || 'Урон'}</small>
                {dmg}
              </button>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export function ConditionsPanel() {
  const { c, set } = useChar()
  const [info, setInfo] = useState<string | null>(null)
  const active = CONDITIONS.filter((x) => c.conditions.includes(x.key))
  return (
    <Section title="Состояния">
      <div className="chips">
        {CONDITIONS.map((cond) => {
          const on = c.conditions.includes(cond.key)
          return (
            <button
              key={cond.key}
              className={`chip ${on ? 'on' : ''}`}
              title={cond.text}
              aria-pressed={on}
              onClick={() =>
                set((d) => {
                  d.conditions = on
                    ? d.conditions.filter((k) => k !== cond.key)
                    : [...d.conditions, cond.key]
                })
              }
              onContextMenu={(e) => {
                e.preventDefault()
                setInfo(cond.key)
              }}
            >
              {cond.name}
            </button>
          )
        })}
      </div>
      <div className="exhaustion">
        <span className="field-label">Истощение</span>
        <Pips
          total={6}
          filled={c.exhaustion}
          kind="bad"
          label="Истощение"
          onChange={(v) =>
            set((d) => {
              d.exhaustion = v
              d.hp.current = Math.min(d.hp.current, effectiveMaxHp(d))
            })
          }
        />
        <span className="small">{EXHAUSTION_LEVELS[c.exhaustion]}</span>
      </div>
      {active.length > 0 && (
        <ul className="cond-effects">
          {active.map((x) => (
            <li key={x.key}>
              <strong>{x.name}.</strong> {x.text}
            </li>
          ))}
        </ul>
      )}
      {info && (
        <Modal title={CONDITIONS.find((x) => x.key === info)!.name} onClose={() => setInfo(null)}>
          <p>{CONDITIONS.find((x) => x.key === info)!.text}</p>
        </Modal>
      )}
    </Section>
  )
}

export function ResourcesPanel() {
  const { c, set } = useChar()
  if (c.resources.length === 0) return null
  return (
    <Section title="Ресурсы">
      <div className="resources">
        {c.resources.map((r, i) => (
          <div key={r.id} className="resource-row">
            <div className="resource-name">
              {r.name}
              <span className="muted small">
                {' '}
                {r.reset === 'short' ? '· кор. отдых' : r.reset === 'long' ? '· прод. отдых' : ''}
              </span>
            </div>
            <div className="row">
              <button
                className="btn sm"
                disabled={r.current <= 0}
                onClick={() => set((d) => void (d.resources[i].current -= 1))}
              >
                −
              </button>
              <Pips
                total={r.max}
                filled={r.current}
                label={r.name}
                onChange={(v) => set((d) => void (d.resources[i].current = v))}
              />
              <button
                className="btn sm"
                disabled={r.current >= r.max}
                onClick={() => set((d) => void (d.resources[i].current += 1))}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

export function RestPanel() {
  const { c, set } = useChar()
  const rolls = useRolls()
  const [short, setShort] = useState(false)
  const [long, setLong] = useState(false)
  return (
    <Section title="Отдых">
      <div className="row wrap">
        <button className="btn" onClick={() => setShort(true)}>
          Короткий отдых
        </button>
        <button className="btn" onClick={() => setLong(true)}>
          Продолжительный отдых
        </button>
      </div>
      {short && (
        <Modal title="Короткий отдых" onClose={() => setShort(false)}>
          <p className="muted">
            Хиты: {c.hp.current}/{effectiveMaxHp(c)}. Потратьте кости хитов, чтобы восстановить
            здоровье (бросок + модификатор Телосложения {fmtMod(mod(c, 'con'))}).
          </p>
          <div className="stack">
            {c.classes.map((cl) => {
              const left = cl.level - cl.hitDiceUsed
              return (
                <div key={cl.id} className="row between">
                  <span>
                    {cl.name || 'Класс'}: d{cl.hitDie} — осталось {left}/{cl.level}
                  </span>
                  <button
                    className="btn sm"
                    disabled={left <= 0 || c.hp.current >= effectiveMaxHp(c)}
                    onClick={() => {
                      const roll = rollDie(cl.hitDie)
                      const healed = set((d) => spendHitDie(d, cl.id, roll))
                      rolls.note(`Кость хитов d${cl.hitDie}: ${roll} ${fmtMod(mod(c, 'con'))}`, [
                        `Восстановлено ${healed} хитов`,
                      ])
                    }}
                  >
                    Бросить d{cl.hitDie}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="row end">
            <button
              className="btn primary"
              onClick={() => {
                const log = set((d) => shortRest(d))
                rolls.note(log[0], log.slice(1))
                setShort(false)
              }}
            >
              Завершить отдых
            </button>
          </div>
          <p className="hint">
            При завершении восстанавливаются ресурсы «кор. отдых» и ячейки магии договора.
          </p>
        </Modal>
      )}
      {long && (
        <Modal title="Продолжительный отдых" onClose={() => setLong(false)}>
          <ul>
            <li>Хиты восстанавливаются полностью, временные хиты сгорают</li>
            <li>Возвращается половина костей хитов (минимум 1)</li>
            <li>Восстанавливаются все ячейки заклинаний и ресурсы</li>
            <li>Истощение снижается на 1 уровень</li>
          </ul>
          <div className="row end">
            <button className="btn ghost" onClick={() => setLong(false)}>
              Отмена
            </button>
            <button
              className="btn primary"
              onClick={() => {
                const log = set((d) => longRest(d))
                rolls.note(log[0], log.slice(1))
                setLong(false)
              }}
            >
              Отдохнуть
            </button>
          </div>
        </Modal>
      )}
    </Section>
  )
}
