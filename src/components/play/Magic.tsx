import { useState } from 'react'
import { ABILITY_NAMES, SPELL_LEVEL_NAMES } from '../../data/rules'
import { fmtMod, saveBonus, spellAttack, spellSaveDC } from '../../lib/calc'
import { useRolls } from '../../state/rolls'
import { useChar } from '../../state/store'
import type { Spell } from '../../types'
import { Modal, Pips, Section } from '../ui'

type SlotChoice = { kind: 'slot'; level: number } | { kind: 'pact' } | { kind: 'ritual' } | { kind: 'free' }

export function SpellsPanel() {
  const { c, set } = useChar()
  const rolls = useRolls()
  const [casting, setCasting] = useState<Spell | null>(null)
  const [details, setDetails] = useState<Spell | null>(null)
  const [showAll, setShowAll] = useState(false)
  const sc = c.spellcasting
  const hasSlots = sc.slots.some((s) => s.max > 0) || sc.pact.max > 0
  if (!sc.ability && sc.spells.length === 0 && !hasSlots) return null

  const dc = spellSaveDC(c)
  const atk = spellAttack(c)
  const castable = sc.spells
    .filter((s) => showAll || s.level === 0 || s.prepared || s.alwaysPrepared)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'ru'))

  const cast = (spell: Spell, choice: SlotChoice) => {
    let slotLevel = spell.level
    set((d) => {
      if (choice.kind === 'slot') {
        d.spellcasting.slots[choice.level - 1].used += 1
        slotLevel = choice.level
      } else if (choice.kind === 'pact') {
        d.spellcasting.pact.used += 1
        slotLevel = d.spellcasting.pact.level
      }
      if (spell.concentration) d.spellcasting.concentration = spell.name
    })
    const how =
      choice.kind === 'ritual'
        ? 'как ритуал'
        : choice.kind === 'free'
          ? spell.level === 0
            ? 'заговор'
            : 'без ячейки'
          : `ячейка ${slotLevel} ур.`
    const notes: string[] = []
    if (sc.concentration && spell.concentration && sc.concentration !== spell.name)
      notes.push(`Концентрация на «${sc.concentration}» прервана`)
    if (spell.save && dc !== null)
      notes.push(`Цель: спасбросок ${ABILITY_NAMES[spell.save]}, Сл ${dc}`)
    if (spell.attackRoll && atk !== null) {
      rolls.d20(`${spell.name} (${how})`, atk, { kind: 'attack' }, {
        notes,
        followUp: spell.damage ? { label: `${spell.name}: урон`, expr: spell.damage, crit: false } : undefined,
      })
    } else if (spell.damage) {
      rolls.note(`Сотворено: ${spell.name} (${how})`, notes)
      rolls.dice(`${spell.name}: урон/лечение`, spell.damage)
    } else {
      rolls.note(`Сотворено: ${spell.name} (${how})`, notes)
    }
    setCasting(null)
  }

  return (
    <Section
      title="Заклинания"
      actions={
        <label className="check small">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Все
        </label>
      }
    >
      <div className="row wrap">
        <div className="stat-pill">
          <span>Сл</span>
          <strong>{dc ?? '—'}</strong>
        </div>
        <div className="stat-pill">
          <span>Атака</span>
          <strong>{atk === null ? '—' : fmtMod(atk)}</strong>
        </div>
        {sc.concentration && (
          <div className="concentration">
            <span>
              Концентрация: <strong>{sc.concentration}</strong>
            </span>
            <button
              className="btn xs"
              onClick={() =>
                rolls.d20('Спасбросок концентрации', saveBonus(c, 'con'), {
                  kind: 'save',
                  ability: 'con',
                })
              }
            >
              Спасбросок
            </button>
            <button
              className="btn xs ghost"
              onClick={() => set((d) => void (d.spellcasting.concentration = ''))}
            >
              Прервать
            </button>
          </div>
        )}
      </div>

      {hasSlots && (
        <div className="slots">
          {sc.slots.map((s, i) =>
            s.max > 0 ? (
              <div key={i} className="slot-row">
                <span className="slot-lvl">{i + 1}</span>
                <Pips
                  total={s.max}
                  filled={s.max - s.used}
                  kind="magic"
                  label={`Ячейки ${i + 1} уровня`}
                  onChange={(v) => set((d) => void (d.spellcasting.slots[i].used = s.max - v))}
                />
                <span className="muted small">
                  {s.max - s.used}/{s.max}
                </span>
              </div>
            ) : null,
          )}
          {sc.pact.max > 0 && (
            <div className="slot-row">
              <span className="slot-lvl" title="Магия договора">
                Д{sc.pact.level}
              </span>
              <Pips
                total={sc.pact.max}
                filled={sc.pact.max - sc.pact.used}
                kind="pact"
                label="Ячейки договора"
                onChange={(v) => set((d) => void (d.spellcasting.pact.used = sc.pact.max - v))}
              />
              <span className="muted small">
                {sc.pact.max - sc.pact.used}/{sc.pact.max}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="spell-cast-list">
        {castable.length === 0 && (
          <p className="empty">Нет подготовленных заклинаний. Добавьте их на вкладке «Лист».</p>
        )}
        {castable.map((s) => (
          <div key={s.id} className="cast-row">
            <span className="lvl-badge" title={SPELL_LEVEL_NAMES[s.level]}>
              {s.level === 0 ? '∞' : s.level}
            </span>
            <button className="linklike cast-name" onClick={() => setDetails(s)}>
              {s.name}
              {s.concentration && <span className="badge">К</span>}
              {s.ritual && <span className="badge">Р</span>}
            </button>
            <span className="muted small hide-sm">{s.castingTime}</span>
            <button
              className="btn sm primary"
              onClick={() => (s.level === 0 ? cast(s, { kind: 'free' }) : setCasting(s))}
            >
              {s.level === 0 ? 'Применить' : 'Сотворить'}
            </button>
          </div>
        ))}
      </div>

      {casting && (
        <CastModal spell={casting} onCast={(ch) => cast(casting, ch)} onClose={() => setCasting(null)} />
      )}
      {details && (
        <Modal title={details.name} onClose={() => setDetails(null)}>
          <p className="muted">
            {SPELL_LEVEL_NAMES[details.level]}
            {details.school && ` · ${details.school}`}
            {details.ritual && ' · ритуал'}
          </p>
          <dl className="spell-props">
            <dt>Время</dt>
            <dd>{details.castingTime || '—'}</dd>
            <dt>Дистанция</dt>
            <dd>{details.range || '—'}</dd>
            <dt>Компоненты</dt>
            <dd>{details.components || '—'}</dd>
            <dt>Длительность</dt>
            <dd>
              {details.concentration && 'Концентрация, '}
              {details.duration || '—'}
            </dd>
          </dl>
          <p className="prewrap">{details.description || 'Описание не заполнено.'}</p>
        </Modal>
      )}
    </Section>
  )
}

function CastModal({
  spell,
  onCast,
  onClose,
}: {
  spell: Spell
  onCast: (ch: SlotChoice) => void
  onClose: () => void
}) {
  const { c } = useChar()
  const sc = c.spellcasting
  const options = sc.slots
    .map((s, i) => ({ level: i + 1, left: s.max - s.used, max: s.max }))
    .filter((o) => o.level >= spell.level && o.max > 0)
  const pactOk = sc.pact.max > 0 && sc.pact.level >= spell.level
  const nothing = options.every((o) => o.left <= 0) && (!pactOk || sc.pact.used >= sc.pact.max)
  return (
    <Modal title={`Сотворить: ${spell.name}`} onClose={onClose}>
      {spell.concentration && sc.concentration && (
        <p className="warn">
          Вы концентрируетесь на «{sc.concentration}» — новое заклинание прервёт концентрацию.
        </p>
      )}
      <p className="muted">Выберите ячейку (можно использовать ячейку большего уровня):</p>
      <div className="slot-choices">
        {options.map((o) => (
          <button
            key={o.level}
            className="btn"
            disabled={o.left <= 0}
            onClick={() => onCast({ kind: 'slot', level: o.level })}
          >
            {o.level} ур. <span className="muted small">({o.left}/{o.max})</span>
          </button>
        ))}
        {pactOk && (
          <button
            className="btn pact"
            disabled={sc.pact.used >= sc.pact.max}
            onClick={() => onCast({ kind: 'pact' })}
          >
            Договор {sc.pact.level} ур.{' '}
            <span className="muted small">
              ({sc.pact.max - sc.pact.used}/{sc.pact.max})
            </span>
          </button>
        )}
      </div>
      {nothing && <p className="warn">Нет доступных ячеек.</p>}
      <div className="row end">
        {spell.ritual && (
          <button className="btn ghost" onClick={() => onCast({ kind: 'ritual' })}>
            Как ритуал (+10 мин.)
          </button>
        )}
        <button className="btn ghost" onClick={() => onCast({ kind: 'free' })}>
          Без ячейки
        </button>
      </div>
    </Modal>
  )
}
