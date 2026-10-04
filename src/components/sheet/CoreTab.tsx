import {
  ABILITIES,
  ABILITY_NAMES,
  ABILITY_SHORT,
  ALIGNMENTS,
  CASTER_TYPE_NAMES,
  CLASS_TEMPLATES,
  RACES,
  SKILLS,
  XP_THRESHOLDS,
} from '../../data/rules'
import {
  abilityMod,
  fmtMod,
  initiative,
  levelFromXp,
  passive,
  pb,
  saveBonus,
  skillBonus,
  totalLevel,
} from '../../lib/calc'
import { newClass } from '../../lib/factory'
import { useChar } from '../../state/store'
import type { CasterType } from '../../types'
import { Field, NumInput, ProfToggle, Section, TextArea, TextInput } from '../ui'

export function CoreTab() {
  return (
    <div className="sheet-grid">
      <IdentityBlock />
      <ClassesBlock />
      <AbilitiesBlock />
      <SkillsBlock />
      <CombatBlock />
      <ProficienciesBlock />
    </div>
  )
}

function IdentityBlock() {
  const { c, set } = useChar()
  const lvl = totalLevel(c)
  const xpLevel = levelFromXp(c.xp)
  const nextXp = XP_THRESHOLDS[lvl]
  return (
    <Section title="Персонаж" className="span-all">
      <div className="identity">
        <Field label="Имя персонажа" className="grow-2">
          <TextInput value={c.name} onChange={(v) => set((d) => void (d.name = v))} />
        </Field>
        <Field label="Раса">
          <TextInput
            value={c.race}
            list="races"
            onChange={(v) => set((d) => void (d.race = v))}
          />
        </Field>
        <Field label="Предыстория">
          <TextInput value={c.background} onChange={(v) => set((d) => void (d.background = v))} />
        </Field>
        <Field label="Мировоззрение">
          <TextInput
            value={c.alignment}
            list="alignments"
            onChange={(v) => set((d) => void (d.alignment = v))}
          />
        </Field>
        <Field label="Игрок">
          <TextInput value={c.playerName} onChange={(v) => set((d) => void (d.playerName = v))} />
        </Field>
        <Field label="Опыт">
          <NumInput value={c.xp} min={0} onChange={(v) => set((d) => void (d.xp = v))} />
        </Field>
      </div>
      <p className="hint">
        Уровень {lvl} · бонус мастерства {fmtMod(pb(c))}
        {nextXp !== undefined && ` · до следующего уровня: ${Math.max(0, nextXp - c.xp)} оп.`}
        {xpLevel > lvl && <strong className="warn"> · Опыта хватает на {xpLevel} уровень!</strong>}
      </p>
      <datalist id="races">
        {RACES.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <datalist id="alignments">
        {ALIGNMENTS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </Section>
  )
}

function ClassesBlock() {
  const { c, set } = useChar()
  const applyTemplate = (idx: number, name: string) =>
    set((d) => {
      const cl = d.classes[idx]
      cl.name = name
      const t = CLASS_TEMPLATES.find((x) => x.name.toLowerCase() === name.trim().toLowerCase())
      if (!t) return
      cl.hitDie = t.hitDie
      cl.caster = t.caster
      // Владение спасбросками даёт только первый класс
      if (idx === 0) {
        ABILITIES.forEach((a) => (d.saveProf[a] = t.saves.includes(a)))
      }
      if (t.spellAbility && !d.spellcasting.ability) d.spellcasting.ability = t.spellAbility
    })
  return (
    <Section
      title="Классы"
      className="span-all"
      actions={
        <button className="btn sm" onClick={() => set((d) => void d.classes.push(newClass()))}>
          + Мультикласс
        </button>
      }
    >
      <div className="table-list">
        {c.classes.map((cl, i) => (
          <div className="class-row" key={cl.id}>
            <Field label="Класс" className="grow-2">
              <TextInput
                value={cl.name}
                list="classes"
                placeholder="Выберите класс"
                onChange={(v) => applyTemplate(i, v)}
              />
            </Field>
            <Field label="Архетип" className="grow-2">
              <TextInput
                value={cl.subclass}
                onChange={(v) => set((d) => void (d.classes[i].subclass = v))}
              />
            </Field>
            <Field label="Уровень">
              <NumInput
                value={cl.level}
                min={1}
                max={20}
                onChange={(v) =>
                  set((d) => {
                    d.classes[i].level = v
                    d.classes[i].hitDiceUsed = Math.min(d.classes[i].hitDiceUsed, v)
                  })
                }
              />
            </Field>
            <Field label="Кость хитов">
              <select
                value={cl.hitDie}
                onChange={(e) => set((d) => void (d.classes[i].hitDie = +e.target.value))}
              >
                {[6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    d{n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Магия" className="grow-2">
              <select
                value={cl.caster}
                onChange={(e) =>
                  set((d) => void (d.classes[i].caster = e.target.value as CasterType))
                }
              >
                {Object.entries(CASTER_TYPE_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            {c.classes.length > 1 && (
              <button
                className="btn ghost sm danger self-end"
                aria-label="Удалить класс"
                onClick={() => set((d) => void d.classes.splice(i, 1))}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <datalist id="classes">
        {CLASS_TEMPLATES.map((t) => (
          <option key={t.name} value={t.name} />
        ))}
      </datalist>
      <p className="hint">
        При выборе класса из списка автоматически подставляются кость хитов, тип заклинателя и
        спасброски (для первого класса).
      </p>
    </Section>
  )
}

function AbilitiesBlock() {
  const { c, set } = useChar()
  return (
    <Section title="Характеристики и спасброски">
      <div className="abilities">
        {ABILITIES.map((a) => (
          <div className="ability" key={a}>
            <div className="ability-name" title={ABILITY_NAMES[a]}>
              {ABILITY_NAMES[a]}
            </div>
            <div className="ability-mod">{fmtMod(abilityMod(c.abilities[a]))}</div>
            <NumInput
              className="ability-score"
              ariaLabel={`Значение: ${ABILITY_NAMES[a]}`}
              value={c.abilities[a]}
              min={1}
              max={30}
              onChange={(v) => set((d) => void (d.abilities[a] = v))}
            />
            <div className="ability-save">
              <ProfToggle
                level={c.saveProf[a] ? 1 : 0}
                allowExpertise={false}
                onChange={(n) => set((d) => void (d.saveProf[a] = n > 0))}
              />
              <span>Спасбр. {fmtMod(saveBonus(c, a))}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function SkillsBlock() {
  const { c, set } = useChar()
  return (
    <Section
      title="Навыки"
      actions={
        <label className="check">
          <input
            type="checkbox"
            checked={c.jackOfAllTrades}
            onChange={(e) => set((d) => void (d.jackOfAllTrades = e.target.checked))}
          />
          Мастер на все руки
        </label>
      }
    >
      <ul className="skills">
        {SKILLS.map((s) => (
          <li key={s.key}>
            <ProfToggle
              level={c.skills[s.key]}
              onChange={(n) => set((d) => void (d.skills[s.key] = n))}
            />
            <span className="skill-bonus">{fmtMod(skillBonus(c, s.key))}</span>
            <span className="skill-name">{s.name}</span>
            <span className="skill-ab">{ABILITY_SHORT[s.ability]}</span>
          </li>
        ))}
      </ul>
      <p className="hint">
        ○ нет · ● владение · ◉ компетентность. Пассивная Внимательность: {passive(c, 'perception')}
      </p>
    </Section>
  )
}

function CombatBlock() {
  const { c, set } = useChar()
  return (
    <Section title="Боевые параметры">
      <div className="stat-boxes">
        <Field label="Класс доспеха">
          <NumInput value={c.ac} min={0} onChange={(v) => set((d) => void (d.ac = v))} />
        </Field>
        <Field label={`Инициатива (${fmtMod(initiative(c))})`}>
          <NumInput
            value={c.initiativeBonus}
            ariaLabel="Доп. бонус инициативы"
            onChange={(v) => set((d) => void (d.initiativeBonus = v))}
          />
        </Field>
        <Field label="Скорость, фт">
          <NumInput value={c.speed} min={0} onChange={(v) => set((d) => void (d.speed = v))} />
        </Field>
        <Field label="Макс. хиты">
          <NumInput
            value={c.hp.max}
            min={1}
            onChange={(v) =>
              set((d) => {
                d.hp.max = v
                d.hp.current = Math.min(d.hp.current, v)
              })
            }
          />
        </Field>
        <Field label="Текущие хиты">
          <NumInput
            value={c.hp.current}
            min={0}
            max={c.hp.max}
            onChange={(v) => set((d) => void (d.hp.current = v))}
          />
        </Field>
        <Field label="Временные хиты">
          <NumInput value={c.hp.temp} min={0} onChange={(v) => set((d) => void (d.hp.temp = v))} />
        </Field>
      </div>
      <p className="hint">
        Поле «Инициатива» — дополнительный бонус (например, черта «Бдительный»); модификатор
        Ловкости добавляется автоматически.
      </p>
      <div className="hit-dice-list">
        <span className="field-label">Кости хитов</span>
        {c.classes.map((cl) => (
          <span key={cl.id} className="tag">
            {cl.level - cl.hitDiceUsed}/{cl.level} d{cl.hitDie} {cl.name && `(${cl.name})`}
          </span>
        ))}
      </div>
      <button
        className="btn sm"
        onClick={() =>
          set((d) => {
            // Средние хиты: максимум кости на 1 уровне, далее среднее (округл. вверх)
            const con = abilityMod(d.abilities.con)
            let hp = 0
            d.classes.forEach((cl, i) => {
              for (let l = 1; l <= cl.level; l++) {
                hp += (i === 0 && l === 1 ? cl.hitDie : cl.hitDie / 2 + 1) + con
              }
            })
            d.hp.max = Math.max(1, hp)
            d.hp.current = d.hp.max
          })
        }
      >
        Рассчитать хиты по среднему
      </button>
    </Section>
  )
}

function ProficienciesBlock() {
  const { c, set } = useChar()
  return (
    <Section title="Владения и языки" className="span-all">
      <div className="two-col">
        <Field label="Доспехи, оружие, инструменты">
          <TextArea
            value={c.proficiencies}
            onChange={(v) => set((d) => void (d.proficiencies = v))}
          />
        </Field>
        <Field label="Языки">
          <TextArea value={c.languages} onChange={(v) => set((d) => void (d.languages = v))} />
        </Field>
      </div>
    </Section>
  )
}
