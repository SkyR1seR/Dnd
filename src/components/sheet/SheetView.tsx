import { useState } from 'react'
import { loadPref, savePref } from '../../lib/storage'
import { AttacksTab } from './AttacksTab'
import { CoreTab } from './CoreTab'
import { FeaturesTab, InventoryTab, PersonalityTab } from './OtherTabs'
import { SpellsTab } from './SpellsTab'

const TABS = [
  { key: 'core', name: 'Основное', el: <CoreTab /> },
  { key: 'attacks', name: 'Атаки и ресурсы', el: <AttacksTab /> },
  { key: 'spells', name: 'Заклинания', el: <SpellsTab /> },
  { key: 'inventory', name: 'Снаряжение', el: <InventoryTab /> },
  { key: 'features', name: 'Умения', el: <FeaturesTab /> },
  { key: 'personality', name: 'Личность', el: <PersonalityTab /> },
]

export function SheetView() {
  const [tab, setTab] = useState(() => loadPref('sheetTab', 'core'))
  const current = TABS.find((t) => t.key === tab) ?? TABS[0]
  return (
    <div className="sheet">
      <nav className="subtabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === current.key}
            className={t.key === current.key ? 'active' : ''}
            onClick={() => {
              setTab(t.key)
              savePref('sheetTab', t.key)
            }}
          >
            {t.name}
          </button>
        ))}
      </nav>
      {current.el}
    </div>
  )
}
