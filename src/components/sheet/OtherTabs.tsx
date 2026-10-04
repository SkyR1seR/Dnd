import { newFeature, newItem } from '../../lib/factory'
import { useChar } from '../../state/store'
import type { Character } from '../../types'
import { Field, NumInput, Section, TextArea, TextInput } from '../ui'

const COINS: { key: keyof Character['currency']; name: string }[] = [
  { key: 'cp', name: 'ММ' },
  { key: 'sp', name: 'СМ' },
  { key: 'ep', name: 'ЭМ' },
  { key: 'gp', name: 'ЗМ' },
  { key: 'pp', name: 'ПМ' },
]

export function CurrencyEditor() {
  const { c, set } = useChar()
  return (
    <div className="coins">
      {COINS.map((m) => (
        <Field key={m.key} label={m.name}>
          <NumInput
            value={c.currency[m.key]}
            min={0}
            onChange={(v) => set((d) => void (d.currency[m.key] = v))}
          />
        </Field>
      ))}
    </div>
  )
}

export function InventoryTab() {
  const { c, set } = useChar()
  const weight = c.items.reduce((s, it) => s + it.qty * it.weight, 0)
  const capacity = c.abilities.str * 15
  return (
    <div className="stack">
      <Section title="Монеты">
        <CurrencyEditor />
      </Section>
      <Section
        title="Снаряжение"
        actions={
          <button className="btn sm" onClick={() => set((d) => void d.items.push(newItem()))}>
            + Предмет
          </button>
        }
      >
        {c.items.length === 0 && <p className="empty">Инвентарь пуст.</p>}
        <div className="table-list">
          {c.items.map((it, i) => (
            <div className="row wrap edit-card" key={it.id}>
              <label className="check self-end" title="Экипировано">
                <input
                  type="checkbox"
                  checked={it.equipped}
                  onChange={(e) => set((d) => void (d.items[i].equipped = e.target.checked))}
                />
              </label>
              <Field label="Предмет" className="grow-2">
                <TextInput
                  value={it.name}
                  onChange={(v) => set((d) => void (d.items[i].name = v))}
                />
              </Field>
              <Field label="Кол-во">
                <NumInput
                  value={it.qty}
                  min={0}
                  onChange={(v) => set((d) => void (d.items[i].qty = v))}
                />
              </Field>
              <Field label="Вес, фнт">
                <NumInput
                  value={it.weight}
                  min={0}
                  onChange={(v) => set((d) => void (d.items[i].weight = v))}
                />
              </Field>
              <Field label="Заметки" className="grow-2">
                <TextInput
                  value={it.notes}
                  onChange={(v) => set((d) => void (d.items[i].notes = v))}
                />
              </Field>
              <button
                className="btn ghost sm danger self-end"
                aria-label="Удалить предмет"
                onClick={() => set((d) => void d.items.splice(i, 1))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <p className={`hint ${weight > capacity ? 'warn' : ''}`}>
          Общий вес: {weight} фнт · грузоподъёмность: {capacity} фнт (Сила × 15)
        </p>
      </Section>
    </div>
  )
}

export function FeaturesTab() {
  const { c, set } = useChar()
  return (
    <Section
      title="Умения и особенности"
      actions={
        <button className="btn sm" onClick={() => set((d) => void d.features.push(newFeature()))}>
          + Умение
        </button>
      }
    >
      {c.features.length === 0 && (
        <p className="empty">Расовые черты, классовые умения, черты (feats)…</p>
      )}
      <div className="table-list">
        {c.features.map((f, i) => (
          <div className="edit-card" key={f.id}>
            <div className="row wrap">
              <Field label="Название" className="grow-2">
                <TextInput
                  value={f.name}
                  onChange={(v) => set((d) => void (d.features[i].name = v))}
                />
              </Field>
              <Field label="Источник">
                <TextInput
                  value={f.source}
                  placeholder="Раса, класс, черта…"
                  onChange={(v) => set((d) => void (d.features[i].source = v))}
                />
              </Field>
              <button
                className="btn ghost sm danger self-end"
                onClick={() => set((d) => void d.features.splice(i, 1))}
              >
                Удалить
              </button>
            </div>
            <TextArea
              value={f.description}
              onChange={(v) => set((d) => void (d.features[i].description = v))}
            />
          </div>
        ))}
      </div>
    </Section>
  )
}

const PERSONALITY: { key: keyof Character['personality']; name: string; rows: number }[] = [
  { key: 'traits', name: 'Черты характера', rows: 3 },
  { key: 'ideals', name: 'Идеалы', rows: 2 },
  { key: 'bonds', name: 'Привязанности', rows: 2 },
  { key: 'flaws', name: 'Слабости', rows: 2 },
  { key: 'appearance', name: 'Внешность', rows: 3 },
  { key: 'backstory', name: 'Предыстория персонажа', rows: 8 },
]

export function PersonalityTab() {
  const { c, set } = useChar()
  return (
    <div className="stack">
      <Section title="Личность">
        <div className="two-col">
          {PERSONALITY.map((p) => (
            <Field key={p.key} label={p.name}>
              <TextArea
                rows={p.rows}
                value={c.personality[p.key]}
                onChange={(v) => set((d) => void (d.personality[p.key] = v))}
              />
            </Field>
          ))}
        </div>
      </Section>
      <Section title="Заметки">
        <TextArea rows={10} value={c.notes} onChange={(v) => set((d) => void (d.notes = v))} />
      </Section>
    </div>
  )
}
