import { useEffect } from 'react'
import { CharacterList } from './components/CharacterList'
import { PlayView } from './components/play/PlayView'
import { SheetView } from './components/sheet/SheetView'
import { go, useRoute } from './lib/router'
import { downloadJson } from './lib/storage'
import { CharacterProvider, StoreProvider, useStore } from './state/store'

function Shell() {
  const route = useRoute()
  const { characters } = useStore()
  const char = route.page !== 'list' ? characters.find((c) => c.id === route.id) : undefined

  useEffect(() => {
    document.title = char ? `${char.name} — Лист персонажа D&D` : 'Лист персонажа D&D 5e'
  }, [char])

  if (route.page !== 'list' && !char) {
    return (
      <div className="app">
        <main className="container">
          <p className="empty">Персонаж не найден.</p>
          <button className="btn" onClick={() => go({ page: 'list' })}>
            К списку персонажей
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => go({ page: 'list' })} title="Все персонажи">
          <span className="brand-icon" aria-hidden>
            ⚀
          </span>
          <span className="brand-text">{char ? '← Персонажи' : 'Лист персонажа D&D 5e'}</span>
        </button>
        {char && route.page !== 'list' && (
          <>
            <nav className="mode-switch" aria-label="Режим">
              <button
                className={route.page === 'sheet' ? 'active' : ''}
                onClick={() => go({ page: 'sheet', id: char.id })}
              >
                📜 Лист
              </button>
              <button
                className={route.page === 'play' ? 'active' : ''}
                onClick={() => go({ page: 'play', id: char.id })}
              >
                ⚔ Игра
              </button>
            </nav>
            <button
              className="btn ghost sm hide-sm"
              title="Скачать персонажа в JSON"
              onClick={() => downloadJson(`${char.name || 'character'}.json`, char)}
            >
              Экспорт
            </button>
          </>
        )}
      </header>
      <main className={`container ${route.page === 'play' ? 'wide' : ''}`}>
        {route.page === 'list' ? (
          <CharacterList />
        ) : (
          <CharacterProvider id={route.id} key={route.id}>
            {route.page === 'sheet' ? <SheetView /> : <PlayView />}
          </CharacterProvider>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
