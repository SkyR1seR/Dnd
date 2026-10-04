import { ABILITIES, ABILITY_SHORT, DAMAGE_TYPES } from '../../data/rules'
import { attackDamageExpr, attackToHit, fmtMod } from '../../lib/calc'
import { parseDice } from '../../lib/dice'
import { newAttack, newResource } from '../../lib/factory'
import { useChar } from '../../state/store'
import type { Attack, Resource } from '../../types'
import { Field, NumInput, Section, TextInput } from '../ui'

export function AttacksTab() {
  return (
    <div className="stack">
      <AttacksEditor />
      <ResourcesEditor />
    </div>
  )
}

function AttacksEditor() {
  const { c, set } = useChar()
  return (
    <Section
      title="Атаки и оружие"
      actions={
        <button className="btn sm" onClick={() => set((d) => void d.attacks.push(newAttack()))}>
          + Атака
        </button>
      }
    >
      {c.attacks.length === 0 && <p className="empty">Добавьте оружие или атакующие заговоры.</p>}
      <div className="table-list">
        {c.attacks.map((a, i) => {
          const upd = (fn: (x: Attack) => void) => set((d) => fn(d.attacks[i]))
          const badDice = !parseDice(a.damage || '0')
          return (
            <div className="edit-card" key={a.id}>
              <div className="row wrap">
                <Field label="Название" className="grow-2">
                  <TextInput value={a.name} onChange={(v) => upd((x) => void (x.name = v))} />
                </Field>
                <Field label="Характеристика">
                  <select
                    value={a.ability}
                    onChange={(e) => upd((x) => void (x.ability = e.target.value as Attack['ability']))}
                  >
                    {ABILITIES.map((ab) => (
                      <option key={ab} value={ab}>
                        {ABILITY_SHORT[ab]}
                      </option>
                    ))}
                    <option value="spell">Закл.</option>
                    <option value="none">—</option>
                  </select>
                </Field>
                <Field label="Доп. к атаке">
                  <NumInput
                    value={a.attackBonus}
                    onChange={(v) => upd((x) => void (x.attackBonus = v))}
                  />
                </Field>
                <Field label="Урон (кости)">
                  <TextInput
                    className={badDice ? 'invalid' : ''}
                    value={a.damage}
                    placeholder="1d8"
                    onChange={(v) => upd((x) => void (x.damage = v))}
                  />
                </Field>
                <Field label="Вид урона">
                  <TextInput
                    value={a.damageType}
                    list="damage-types"
                    onChange={(v) => upd((x) => void (x.damageType = v))}
                  />
                </Field>
              </div>
              <div className="row wrap">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={a.proficient}
                    onChange={(e) => upd((x) => void (x.proficient = e.target.checked))}
                  />
                  Владение
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={a.addAbilityToDamage}
                    onChange={(e) => upd((x) => void (x.addAbilityToDamage = e.target.checked))}
                  />
                  Модификатор к урону
                </label>
                <Field label="Заметки" className="grow-2">
                  <TextInput
                    value={a.notes}
                    placeholder="Фехтовальное, дистанция 80/320…"
                    onChange={(v) => upd((x) => void (x.notes = v))}
                  />
                </Field>
                <span className="summary">
                  {fmtMod(attackToHit(c, a))} к попаданию · {attackDamageExpr(c, a)}
                </span>
                <button
                  className="btn ghost sm danger"
                  onClick={() => set((d) => void d.attacks.splice(i, 1))}
                >
                  Удалить
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <datalist id="damage-types">
        {DAMAGE_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </Section>
  )
}

const RESET_NAMES: Record<Resource['reset'], string> = {
  short: 'Короткий отдых',
  long: 'Продолжительный отдых',
  none: 'Вручную',
}

function ResourcesEditor() {
  const { c, set } = useChar()
  return (
    <Section
      title="Ограниченные ресурсы"
      actions={
        <button
          className="btn sm"
          onClick={() => set((d) => void d.resources.push(newResource()))}
        >
          + Ресурс
        </button>
      }
    >
      {c.resources.length === 0 && (
        <p className="empty">
          Ярость, ки, вдохновение барда, канал божественности, всплеск действий, боеприпасы…
        </p>
      )}
      <div className="table-list">
        {c.resources.map((r, i) => (
          <div className="row wrap edit-card" key={r.id}>
            <Field label="Название" className="grow-2">
              <TextInput
                value={r.name}
                onChange={(v) => set((d) => void (d.resources[i].name = v))}
              />
            </Field>
            <Field label="Максимум">
              <NumInput
                value={r.max}
                min={0}
                onChange={(v) =>
                  set((d) => {
                    d.resources[i].max = v
                    d.resources[i].current = Math.min(d.resources[i].current, v)
                  })
                }
              />
            </Field>
            <Field label="Восстановление">
              <select
                value={r.reset}
                onChange={(e) =>
                  set((d) => void (d.resources[i].reset = e.target.value as Resource['reset']))
                }
              >
                {Object.entries(RESET_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <button
              className="btn ghost sm danger self-end"
              onClick={() => set((d) => void d.resources.splice(i, 1))}
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}
