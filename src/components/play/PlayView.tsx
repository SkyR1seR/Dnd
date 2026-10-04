import { useState } from 'react'
import { loadPref, savePref } from '../../lib/storage'
import { RollProvider } from '../../state/rolls'
import { DiceTray, RollLog, RollToast } from './Dice'
import { SpellsPanel } from './Magic'
import { AttacksPanel, ChecksPanel, ConditionsPanel, ResourcesPanel, RestPanel } from './Panels'
import { HpPanel, PlayHeader } from './Vitals'

const MOBILE_TABS = [
  { key: 'combat', name: 'Бой', icon: '⚔' },
  { key: 'checks', name: 'Проверки', icon: '🎯' },
  { key: 'magic', name: 'Магия', icon: '✦' },
  { key: 'status', name: 'Состояние', icon: '♥' },
  { key: 'dice', name: 'Кубы', icon: '🎲' },
] as const

type MobileTab = (typeof MOBILE_TABS)[number]['key']

export function PlayView() {
  return (
    <RollProvider>
      <PlayLayout />
    </RollProvider>
  )
}

function PlayLayout() {
  const [tab, setTab] = useState<MobileTab>(() => loadPref('playTab', 'combat'))
  const pick = (t: MobileTab) => {
    setTab(t)
    savePref('playTab', t)
    window.scrollTo({ top: 0 })
  }
  // На широком экране показываются все колонки, на телефоне — только активная вкладка
  const show = (t: MobileTab) => `pane ${tab === t ? 'pane-active' : ''}`
  return (
    <div className="play">
      <PlayHeader />
      <div className="play-grid">
        <div className="play-col">
          <div className={show('checks')}>
            <ChecksPanel />
          </div>
        </div>
        <div className="play-col">
          <div className={show('combat')}>
            <HpPanel />
            <AttacksPanel />
          </div>
          <div className={show('magic')}>
            <SpellsPanel />
          </div>
        </div>
        <div className="play-col">
          <div className={show('status')}>
            <ConditionsPanel />
            <ResourcesPanel />
            <RestPanel />
          </div>
          <div className={show('dice')}>
            <DiceTray />
            <RollLog />
          </div>
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Разделы игрового режима">
        {MOBILE_TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            aria-current={tab === t.key}
            onClick={() => pick(t.key)}
          >
            <span aria-hidden>{t.icon}</span>
            {t.name}
          </button>
        ))}
      </nav>
      <RollToast />
    </div>
  )
}
