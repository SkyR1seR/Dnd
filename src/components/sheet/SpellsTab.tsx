import { useState } from 'react'
import { ABILITIES, ABILITY_NAMES, ABILITY_SHORT, SPELL_LEVEL_NAMES, SPELL_SCHOOLS } from '../../data/rules'
import { fmtMod, spellAttack, spellSaveDC } from '../../lib/calc'
import { parseDice } from '../../lib/dice'
import { newSpell } from '../../lib/factory'
import { useChar } from '../../state/store'
import type { Ability, Spell } from '../../types'
import { Field, NumInput, Section, TextArea, TextInput } from '../ui'

export function SpellsTab() {
  return (
    <div className="stack">
      <SpellcastingBlock />
      <SpellList />
    </div>
  )
}

function SpellcastingBlock() {
  const { c, set } = useChar()
  const sc = c.spellcasting
  const dc = spellSaveDC(c)
  const atk = spellAttack(c)
  return (
    <Section title="Использование заклинаний">
      <div className="row wrap">
        <Field label="Класс заклинателя">
          <TextInput
            value={sc.className}
            placeholder={c.classes.find((cl) => cl.caster !== 'none')?.name ?? ''}
            onChange={(v) => set((d) => void (d.spellcasting.className = v))}
          />
        </Field>
        <Field label="Базовая характеристика заклинаний">
          <select
            value={sc.ability}
            onChange={(e) =>
              set((d) => void (d.spellcasting.ability = e.target.value as Ability | ''))
            }
          >
            <option value="">—</option>
            {ABILITIES.map((a) => (
              <option key={a} value={a}>
                {ABILITY_NAMES[a]}
              </option>
            ))}
          </select>
        </Field>
        <div className="stat-pill">
          <span>Сложность спасброска</span>
          <strong>{dc ?? '—'}</strong>
        </div>
        <div className="stat-pill">
          <span>Бонус броска атаки</span>
          <strong>{atk === null ? '—' : fmtMod(atk)}</strong>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={sc.autoSlots}
            onChange={(e) => set((d) => void (d.spellcasting.autoSlots = e.target.checked))}
          />
          Ячейки по таблице классов
        </label>
      </div>
      <div className="slot-editor">
        {sc.slots.map((s, i) => (
          <Field key={i} label={`${i + 1} ур.`}>
            <NumInput
              value={s.max}
              min={0}
              max={9}
              onChange={(v) =>
                set((d) => {
                  d.spellcasting.autoSlots = false
                  d.spellcasting.slots[i].max = v
                  d.spellcasting.slots[i].used = Math.min(d.spellcasting.slots[i].used, v)
                })
              }
            />
          </Field>
        ))}
        <Field label="Договор: ячеек">
          <NumInput
            value={sc.pact.max}
            min={0}
            max={4}
            onChange={(v) =>
              set((d) => {
                d.spellcasting.autoSlots = false
                d.spellcasting.pact.max = v
                d.spellcasting.pact.used = Math.min(d.spellcasting.pact.used, v)
              })
            }
          />
        </Field>
        <Field label="Договор: ур.">
          <NumInput
            value={sc.pact.level}
            min={0}
            max={5}
            onChange={(v) =>
              set((d) => {
                d.spellcasting.autoSlots = false
                d.spellcasting.pact.level = v
              })
            }
          />
        </Field>
      </div>
      <p className="hint">
        Ячейки рассчитываются автоматически по уровням классов (включая мультикласс и магию
        договора колдуна). Измените любое значение вручную — авторасчёт отключится.
      </p>
    </Section>
  )
}

function SpellList() {
  const { c, set } = useChar()
  const [open, setOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const spells = c.spellcasting.spells
  const byLevel = SPELL_LEVEL_NAMES.map((_, lvl) =>
    spells
      .map((s, idx) => ({ s, idx }))
      .filter(
        ({ s }) => s.level === lvl && s.name.toLowerCase().includes(filter.trim().toLowerCase()),
      )
      .sort((a, b) => a.s.name.localeCompare(b.s.name, 'ru')),
  )
  const add = (lvl: number) => {
    const sp = newSpell(lvl)
    set((d) => void d.spellcasting.spells.push(sp))
    setOpen(sp.id)
  }
  return (
    <Section
      title={`Заклинания (${spells.length})`}
      actions={
        <>
          <input
            className="search"
            placeholder="Поиск…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="btn sm" onClick={() => add(0)}>
            + Заклинание
          </button>
        </>
      }
    >
      {byLevel.map((list, lvl) =>
        list.length === 0 ? null : (
          <div key={lvl} className="spell-group">
            <h4>
              {SPELL_LEVEL_NAMES[lvl]}{' '}
              <button className="btn ghost xs" onClick={() => add(lvl)}>
                +
              </button>
            </h4>
            {list.map(({ s, idx }) => (
              <SpellRow
                key={s.id}
                spell={s}
                open={open === s.id}
                onToggle={() => setOpen(open === s.id ? null : s.id)}
                onChange={(fn) => set((d) => fn(d.spellcasting.spells[idx]))}
                onDelete={() => set((d) => void d.spellcasting.spells.splice(idx, 1))}
              />
            ))}
          </div>
        ),
      )}
      {spells.length === 0 && <p className="empty">Список заклинаний пуст.</p>}
      <datalist id="schools">
        {SPELL_SCHOOLS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </Section>
  )
}

function SpellRow({
  spell: s,
  open,
  onToggle,
  onChange,
  onDelete,
}: {
  spell: Spell
  open: boolean
  onToggle: () => void
  onChange: (fn: (s: Spell) => void) => void
  onDelete: () => void
}) {
  return (
    <div className={`spell-row ${open ? 'open' : ''}`}>
      <div className="spell-line">
        {s.level > 0 && (
          <input
            type="checkbox"
            title="Подготовлено"
            aria-label="Подготовлено"
            checked={s.prepared || s.alwaysPrepared}
            disabled={s.alwaysPrepared}
            onChange={(e) => onChange((x) => void (x.prepared = e.target.checked))}
          />
        )}
        <button className="spell-name linklike" onClick={onToggle}>
          {s.name}
        </button>
        {s.concentration && <span className="badge" title="Концентрация">К</span>}
        {s.ritual && <span className="badge" title="Ритуал">Р</span>}
        <span className="muted small">{s.castingTime}</span>
      </div>
      {open && (
        <div className="spell-edit">
          <div className="row wrap">
            <Field label="Название" className="grow-2">
              <TextInput value={s.name} onChange={(v) => onChange((x) => void (x.name = v))} />
            </Field>
            <Field label="Уровень">
              <select
                value={s.level}
                onChange={(e) => onChange((x) => void (x.level = +e.target.value))}
              >
                {SPELL_LEVEL_NAMES.map((n, i) => (
                  <option key={i} value={i}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Школа">
              <TextInput
                value={s.school}
                list="schools"
                onChange={(v) => onChange((x) => void (x.school = v))}
              />
            </Field>
          </div>
          <div className="row wrap">
            <Field label="Время накладывания">
              <TextInput
                value={s.castingTime}
                onChange={(v) => onChange((x) => void (x.castingTime = v))}
              />
            </Field>
            <Field label="Дистанция">
              <TextInput value={s.range} onChange={(v) => onChange((x) => void (x.range = v))} />
            </Field>
            <Field label="Компоненты">
              <TextInput
                value={s.components}
                placeholder="В, С, М"
                onChange={(v) => onChange((x) => void (x.components = v))}
              />
            </Field>
            <Field label="Длительность">
              <TextInput
                value={s.duration}
                onChange={(v) => onChange((x) => void (x.duration = v))}
              />
            </Field>
          </div>
          <div className="row wrap">
            <label className="check">
              <input
                type="checkbox"
                checked={s.concentration}
                onChange={(e) => onChange((x) => void (x.concentration = e.target.checked))}
              />
              Концентрация
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={s.ritual}
                onChange={(e) => onChange((x) => void (x.ritual = e.target.checked))}
              />
              Ритуал
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={s.alwaysPrepared}
                onChange={(e) => onChange((x) => void (x.alwaysPrepared = e.target.checked))}
              />
              Всегда подготовлено
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={s.attackRoll}
                onChange={(e) => onChange((x) => void (x.attackRoll = e.target.checked))}
              />
              Бросок атаки
            </label>
            <Field label="Спасбросок цели">
              <select
                value={s.save}
                onChange={(e) => onChange((x) => void (x.save = e.target.value as Ability | ''))}
              >
                <option value="">—</option>
                {ABILITIES.map((a) => (
                  <option key={a} value={a}>
                    {ABILITY_SHORT[a]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Урон / лечение">
              <TextInput
                className={s.damage && !parseDice(s.damage) ? 'invalid' : ''}
                value={s.damage}
                placeholder="8d6"
                onChange={(v) => onChange((x) => void (x.damage = v))}
              />
            </Field>
          </div>
          <Field label="Описание">
            <TextArea
              rows={5}
              value={s.description}
              onChange={(v) => onChange((x) => void (x.description = v))}
            />
          </Field>
          <div className="row end">
            <button className="btn ghost sm danger" onClick={onDelete}>
              Удалить заклинание
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
